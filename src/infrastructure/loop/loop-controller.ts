import type { AppContext } from '@application/context'
import { readLoopBudget } from '@application/settings/read-loop-budget'
import { loopBlocked } from '@domain/loop/loop-gate'
import { loopConfigured } from '@domain/settings/loop-budget'
import { getAppContext } from '../persistence/app-context'
import { cancelRun } from '../run-control'
import { releaseKeepAwake, requestKeepAwake } from '../system/keep-awake'
import { isFortressRepo } from '../system/self-project'
import { runEngine } from './loop-engine'
import { activeCount, cancelLoop, clearLoop, isRunning, markRunning } from './loop-registry'

/**
 * El loop pide el candado mientras trabaja y suelta el SUYO al terminar. Lo que
 * haya pedido el operador no se toca: son dos peticionarios distintos.
 */
function refreshKeepAwake(): void {
  if (activeCount() > 0) requestKeepAwake('loop')
  else releaseKeepAwake('loop')
}

/** Motivo por el que el loop de ese proyecto no puede arrancar, o null. */
function blocked(context: AppContext, projectId: string): string | null {
  const project = context.projects.findById(projectId)
  if (!project) return 'Ese proyecto ya no existe'
  return loopBlocked({
    trusted: project.trusted,
    selfRepo: isFortressRepo(project.path),
    configured: loopConfigured(readLoopBudget(context))
  })
}

/**
 * Arranca el loop de un proyecto si no corre ya. Fire-and-forget: el motor
 * persiste su progreso y se limpia solo al terminar.
 *
 * TODAS las vias de arranque (toggle, reanudacion, cualquier caller futuro)
 * pasan por aqui, asi que el gate se aplica aqui: un proyecto que no lo pasa
 * no arranca por NINGUNA via. Ademas se apaga su flag, porque un loop_enabled
 * que el gate rechaza es un estado que miente (p. ej. el repo propio con el
 * flag heredado de antes de esta guarda).
 */
export function startLoop(projectId: string): void {
  if (isRunning(projectId)) return
  const context = getAppContext()
  if (blocked(context, projectId) !== null) {
    context.projects.setLoopEnabled(projectId, false)
    return
  }
  markRunning(projectId)
  refreshKeepAwake()
  void runEngine(context, projectId).finally(() => {
    clearLoop(projectId)
    refreshKeepAwake()
  })
}

/** Parada de emergencia humana: marca cancelado y mata el hijo en curso. */
export function stopLoop(projectId: string): void {
  cancelLoop(projectId)
  cancelRun(projectId)
}

/** Al arrancar la app: reanuda los loops que quedaron vivos (aislados por proyecto). */
export function resumeLoops(): void {
  const context = getAppContext()
  for (const session of context.loopSessions.activeSessions()) {
    if (context.projects.findById(session.projectId)?.loopEnabled) startLoop(session.projectId)
  }
}
