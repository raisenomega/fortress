import type { NewSelfObservation, ObservationStatus, SelfObservation } from './self-observation'

/** Puerto del backlog de auto-mejora de FORTRESS. Sobrevive a que se quite el
 *  proyecto origen: es sobre FORTRESS, no sobre el proyecto. */
export interface SelfObservationRepository {
  add(observation: NewSelfObservation): SelfObservation
  /** Pendientes (no atendidas ni descartadas), del mas reciente al mas antiguo. */
  listOpen(): readonly SelfObservation[]
  /**
   * Cierra una observacion diciendo en que quedo, quien y por que. Devuelve si
   * cambio algo: el `WHERE id = ?` que no encuentra nada es como se detecta un
   * id inexistente sin una consulta previa (patron de `markMitigated`).
   */
  setStatus(entrada: CambioDeEstado): boolean
  resolve(id: string): void
}

/** Lo que hace falta para cerrar una observacion. */
export interface CambioDeEstado {
  readonly id: string
  readonly status: ObservationStatus
  readonly reason: string | null
  readonly attendedBy: string
  readonly attendedAt: string
}
