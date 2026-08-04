import type { NewSelfObservation, SelfObservation } from './self-observation'

/** Puerto del backlog de auto-mejora de FORTRESS. Sobrevive a que se quite el
 *  proyecto origen: es sobre FORTRESS, no sobre el proyecto. */
export interface SelfObservationRepository {
  add(observation: NewSelfObservation): SelfObservation
  /** Pendientes (no atendidas), del mas reciente al mas antiguo. */
  listOpen(): readonly SelfObservation[]
  resolve(id: string): void
}
