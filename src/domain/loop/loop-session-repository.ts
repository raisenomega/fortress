import type { LoopSession } from './loop-session'

/** Puerto de persistencia de las sesiones de loop. Una fila por proyecto. */
export interface LoopSessionRepository {
  get(projectId: string): LoopSession | null
  save(session: LoopSession): void
  /** Sesiones vivas: las que hay que reanudar al arrancar la app. */
  activeSessions(): readonly LoopSession[]
}
