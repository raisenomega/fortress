import type { AppContext } from '@application/context'
import type { LoopConfig } from '@application/loop/loop-deps'
import { runLoop } from '@application/loop/run-loop'
import { solvedStreak } from '@domain/loop/loop-decision'
import { spentToday } from '@application/settings/read-budget'
import { readLoopBudget } from '@application/settings/read-loop-budget'
import type { LoopStatus } from '@domain/loop/loop-status'
import { buildDeps } from './loop-deps-factory'
import { sendLoopStatus } from './loop-registry'
import { resumeState } from './loop-resume'

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
    solvedStreak: solvedStreak(track.recentScores),
    stopReason: null
  }
}

/**
 * Corre una sesion de loop de principio a fin. Reanuda desde la sesion
 * persistida si la habia (nada se pierde) y la marca inactiva al parar.
 */
export async function runEngine(context: AppContext, projectId: string): Promise<void> {
  const budget = readLoopBudget(context)
  const project = context.projects.findById(projectId)
  if (!project || budget.costCapUsd <= 0 || budget.maxCycles <= 0) return

  const { baseline, initial } = resumeState(context, projectId)
  const config: LoopConfig = { projectId, costCap: budget.costCapUsd, maxCycles: budget.maxCycles }
  const track: Track = { recentScores: initial?.recentScores ?? [], cyclesDone: initial?.cyclesDone ?? 0 }
  const save = (active: boolean): void =>
    context.loopSessions.save({ ...track, projectId, active, spentBaseline: baseline, updatedAt: '' })
  save(true)

  const deps = buildDeps({
    context,
    config,
    project,
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
