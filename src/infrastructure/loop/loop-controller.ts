import { getAppContext } from '../persistence/app-context'
import { cancelRun } from '../run-control'
import { setKeepAwake } from '../system/keep-awake'
import { runEngine } from './loop-engine'
import { activeCount, cancelLoop, clearLoop, isRunning, markRunning } from './loop-registry'

/** La pantalla se mantiene encendida mientras haya algun loop corriendo. */
function refreshKeepAwake(): void {
  setKeepAwake(activeCount() > 0)
}

/** Arranca el loop de un proyecto si no corre ya. Fire-and-forget: el motor
 *  persiste su progreso y se limpia solo al terminar. */
export function startLoop(projectId: string): void {
  if (isRunning(projectId)) return
  markRunning(projectId)
  refreshKeepAwake()
  void runEngine(getAppContext(), projectId).finally(() => {
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
