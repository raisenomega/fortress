/**
 * Estado PERSISTIDO de una sesion de loop, para que sobreviva a reinicios de la
 * app o de la sesion de la cuenta. Aislado por proyecto: una fila por proyecto.
 * Al arrancar, un proyecto con el loop encendido y sesion activa se reanuda
 * desde aqui —mismas propuestas cerradas, mismos scores— y nada se pierde.
 */
import type { LoopStopReason } from './loop-status'

export interface LoopSession {
  readonly projectId: string
  /** Sesion viva: se reanuda al arrancar. false cuando paro por algo terminal. */
  readonly active: boolean
  readonly cyclesDone: number
  /** Scores de los ultimos escaneos, del mas reciente al mas antiguo. */
  readonly recentScores: readonly number[]
  /** Gasto del dia (spentToday) al arrancar la sesion: la base del tope de sesion. */
  readonly spentBaseline: number
  readonly updatedAt: string
  /**
   * Por que dejo de correr, y con que cifra. Ausentes en las sesiones
   * anteriores a que esto se guardara: ausente es "no consta", no "sin motivo".
   */
  readonly stoppedReason?: LoopStopReason
  readonly stoppedReasonDetail?: string
  readonly stoppedAt?: string
}
