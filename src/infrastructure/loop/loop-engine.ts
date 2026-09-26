import type { AppContext } from '@application/context'
import type { LoopConfig } from '@application/loop/loop-deps'
import { runLoop } from '@application/loop/run-loop'
import { spentTodayByProject } from '@application/settings/read-budget'
import { readLoopBudget } from '@application/settings/read-loop-budget'
import { loopBlocked } from '@domain/loop/loop-gate'
import { gateDe } from './gate-del-loop'
import { persistirSesion } from './persistir-sesion'
import { buildDeps } from './loop-deps-factory'
import { observarParada, observarStandby } from './loop-observa'
import { sendLoopStatus } from './loop-registry'
import { resumeState } from './loop-resume'
import { hechosDeParada, paradaLimpia, paradaPorFallo, type Parada } from './loop-stop-record'
import { resumeTrack, standbyStatus } from './loop-track'

/**
 * Corre una sesion de loop de principio a fin. Reanuda desde la sesion
 * persistida si la habia (nada se pierde) y la marca inactiva al parar.
 */
export async function runEngine(context: AppContext, projectId: string): Promise<void> {
  const budget = readLoopBudget(context)
  const project = context.projects.findById(projectId)
  if (!project) return
  // Re-aplica el gate aunque startLoop ya lo hizo: cinturon y tirantes. Un
  // caller que se salte el controller se topa aqui con la misma pared.
  const gate = gateDe(project, budget)
  if (loopBlocked(gate) !== null) return

  const { baseline, initial } = resumeState(context, projectId)
  const config: LoopConfig = { projectId, costCap: budget.costCapUsd, maxCycles: budget.maxCycles }
  const track = resumeTrack(initial)
  const save = persistirSesion(context, projectId, track, baseline)
  save(true)

  const deps = buildDeps({
    context,
    config,
    baseline,
    hastaGate: gate.hastaGate,
    onStandby: (error) => {
      // Lo suyo, al sistema nervioso (sub-pieza 4 del #5); el aviso, al renderer.
      observarStandby(context, project, error)
      sendLoopStatus(standbyStatus(config, track, spentTodayByProject(context, new Date(), projectId) - baseline)) // prettier-ignore
    },
    persist: (recentScores, cyclesDone) => {
      track.recentScores = recentScores
      track.cyclesDone = cyclesDone
      save(true)
    }
  })

  // El finally sigue mandando: una sesion viva no sobrevive a su ciclo.
  let parada: Parada | null = null
  try {
    const motivo = await runLoop(config, deps, initial)
    parada = paradaLimpia(motivo, hechosDeParada(context, projectId, budget, track.cyclesDone, baseline)) // prettier-ignore
  } catch (error) {
    parada = paradaPorFallo(error)
  } finally {
    save(false, parada)
    if (parada !== null) observarParada(context, project, parada)
  }
}
