import type { AppContext } from '@application/context'
import type { LoopConfig } from '@application/loop/loop-deps'
import { runLoop } from '@application/loop/run-loop'
import { spentToday } from '@application/settings/read-budget'
import { readLoopBudget } from '@application/settings/read-loop-budget'
import { loopBlocked } from '@domain/loop/loop-gate'
import { loopConfigured } from '@domain/settings/loop-budget'
import { isFortressRepo } from '../system/self-project'
import { buildDeps } from './loop-deps-factory'
import { sendLoopStatus } from './loop-registry'
import { resumeState } from './loop-resume'
import { standbyStatus, type Track } from './loop-track'

/**
 * Corre una sesion de loop de principio a fin. Reanuda desde la sesion
 * persistida si la habia (nada se pierde) y la marca inactiva al parar.
 *
 * Re-aplica el gate aunque startLoop ya lo hizo: cinturon y tirantes. Un
 * caller futuro que se salte el controller se topa aqui con la misma pared.
 */
export async function runEngine(context: AppContext, projectId: string): Promise<void> {
  const budget = readLoopBudget(context)
  const project = context.projects.findById(projectId)
  if (!project) return
  const gate = {
    trusted: project.trusted,
    selfRepo: isFortressRepo(project.path),
    configured: loopConfigured(budget)
  }
  if (loopBlocked(gate) !== null) return

  const { baseline, initial } = resumeState(context, projectId)
  const config: LoopConfig = { projectId, costCap: budget.costCapUsd, maxCycles: budget.maxCycles }
  const track: Track = {
    recentScores: initial?.recentScores ?? [],
    cyclesDone: initial?.cyclesDone ?? 0
  }
  const save = (active: boolean): void =>
    context.loopSessions.save({
      ...track,
      projectId,
      active,
      spentBaseline: baseline,
      updatedAt: ''
    })
  save(true)

  const deps = buildDeps({
    context,
    config,
    project,
    baseline,
    onStandby: () =>
      sendLoopStatus(standbyStatus(config, track, spentToday(context, new Date()) - baseline)),
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
