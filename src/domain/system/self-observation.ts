/**
 * Observacion que un agente hace sobre FORTRESS MISMO mientras trabaja en OTRO
 * proyecto: un limite, un bug, un gap o una funcionalidad que le falto y que le
 * impidio hacer bien su trabajo. No es un hallazgo del proyecto (eso va al
 * proyecto); es material para que FORTRESS se mejore a si misma con cada trabajo.
 */
export type ObservationKind = 'bug' | 'gap' | 'limitacion' | 'falta'

export const OBSERVATION_KINDS: readonly ObservationKind[] = ['bug', 'gap', 'limitacion', 'falta']

export interface SelfObservation {
  readonly id: string
  /** El proyecto donde el agente lo descubrio (no es del proyecto, es de FORTRESS). */
  readonly sourceProject: string
  readonly kind: ObservationKind
  /** Que parte de FORTRESS (allowlist, grafo, escaner, UI...). */
  readonly area: string
  /** Que paso o que falta, en palabras del agente. */
  readonly note: string
  /** Abierto (pendiente) o ya atendido. */
  readonly resolved: boolean
  readonly createdAt: string
}

/** Lo que aporta el parser antes de persistir (id/fecha/estado los pone la base). */
export interface NewSelfObservation {
  readonly sourceProject: string
  readonly kind: ObservationKind
  readonly area: string
  readonly note: string
}
