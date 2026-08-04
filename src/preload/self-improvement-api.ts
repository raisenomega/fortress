import type { Capability } from '@domain/system/capability'
import type { SelfObservation } from '@domain/system/self-observation'

/**
 * Backlog de auto-mejora: lo que los agentes descubren de FORTRESS mismo
 * mientras trabajan en otros proyectos, para que el sistema madure solo.
 */
export interface SelfImprovementApi {
  /** Pendientes abiertos, del mas reciente al mas antiguo. */
  observations(): Promise<readonly SelfObservation[]>
  resolveObservation(id: string): Promise<void>
  /** Capacidades auto-propuestas con su fase y madurez, derivadas del historial. */
  capabilities(): Promise<readonly Capability[]>
}
