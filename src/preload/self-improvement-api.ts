import type { SelfObservation } from '@domain/system/self-observation'

/**
 * Backlog de auto-mejora: lo que los agentes descubren de FORTRESS mismo
 * mientras trabajan en otros proyectos, para que el sistema madure solo.
 */
export interface SelfImprovementApi {
  /** Pendientes abiertos, del mas reciente al mas antiguo. */
  observations(): Promise<readonly SelfObservation[]>
  resolveObservation(id: string): Promise<void>
}
