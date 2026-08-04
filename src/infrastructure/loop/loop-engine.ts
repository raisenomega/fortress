import type { AppContext } from '@application/context'
import type { LoopConfig } from '@application/loop/loop-deps'
import { runLoop } from '@application/loop/run-loop'
import { spentToday } from '@application/settings/read-budget'
import { readLoopBudget } from '@application/settings/read-loop-budget'
import type { LoopStatus } from '@domain/loop/loop-status'
import type { OperationMode } from '@domain/settings/operation-mode'
import { buildDeps } from './loop-deps-factory'
import { sendLoopStatus } from './loop-registry'
import { resumeState } from './loop-resume'

/** Inc 4: auditoria (supervisado, NO edita). Inc 5: 'autonomo' para reparar. */
const LOOP_MODE: OperationMode = 'supervisado'

interface Track {
  recentScores: readonly number[]
  cyclesDone: number
}

function standbyStatus(config: LoopConfig, track: Track, spent: number): LoopStatus {
  return {
    projectId: config.projectId,
    phase: 'standby',
    cycle: track.cyclesDone + 1,
    maxCycles: config.maxCycles,
    score: track.recentScores[0] ?? null,
    spentSession: spent,
    costCap: config.costCap,
    stopReason: null
  }
}

/**
 * Corre una sesion de loop de principio a fin. Reanuda desde la sesion
 * persistida si la habia (nada se pierde) y la marca inactiva al parar.
 */
export async function runEngine(context: AppContext, projectId: string): Promise<void> {
  const budget = readLoopBudget(context)
  if (!context.projects.findById(projectId) || budget.costCapUsd <= 0 || budget.maxCycles <= 0) return

  const { baseline, initial } = resumeState(context, projectId)
  const config: LoopConfig = { projectId, costCap: budget.costCapUsd, maxCycles: budget.maxCycles }
  const track: Track = { recentScores: initial?.recentScores ?? [], cyclesDone: initial?.cyclesDone ?? 0 }
  const save = (active: boolean): void =>
    context.loopSessions.save({ ...track, projectId, active, spentBaseline: baseline, updatedAt: '' })
  save(true)

  const deps = buildDeps({
    context,
    config,
    mode: LOOP_MODE,
    baseline,
    onStandby: () => sendLoopStatus(standbyStatus(config, track, spentToday(context, new Date()) - baseline)),
    persist: (recentScores, cyclesDone) => {
      track.recentScores = recentScores
      track.cyclesDone = cyclesDone
      save(true)
    }
  })

  try {
    await runLoop(config, deps, initial)
  } catch {
    // LoopCancelled o LoopTerminal: en ambos el loop deja de correr.
  } finally {
    save(false)
  }
}
