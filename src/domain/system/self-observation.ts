/**
 * Observacion que un agente hace sobre FORTRESS MISMO mientras trabaja en OTRO
 * proyecto: un limite, un bug, un gap, algo que le falto (incluidos bloqueos de
 * entorno/permisos/plan-mode) o la OPORTUNIDAD de una capacidad nueva. No es un
 * hallazgo del proyecto (eso va al proyecto); es material para que FORTRESS se
 * mejore a si misma con cada trabajo.
 */
export type ObservationKind = 'bug' | 'gap' | 'limitacion' | 'falta' | 'oportunidad'

export const OBSERVATION_KINDS: readonly ObservationKind[] = [
  'bug',
  'gap',
  'limitacion',
  'falta',
  'oportunidad'
]

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

/**
 * La observacion tal como la deja el agente. No sabe en que proyecto trabaja
 * —eso lo sabe quien lo lanzo—, asi que el origen se le pone despues.
 */
export interface SelfNoteDraft {
  readonly kind: ObservationKind
  readonly area: string
  readonly note: string
}

/** Lo que aporta el parser antes de persistir (id/fecha/estado los pone la base). */
export type NewSelfObservation = SelfNoteDraft & { readonly sourceProject: string }
