/**
 * Nota de refuerzo hacia una capacidad: un "dato seed" que la orienta mientras
 * aprende. La deja un agente (con su nombre) o el operador. Solo observa y
 * refuerza; no ejecuta nada. Es material de cognition, no una orden.
 */
export interface CapabilityNote {
  readonly id: string
  readonly capabilityId: string
  readonly author: string
  readonly note: string
  readonly createdAt: string
}

export interface NewCapabilityNote {
  readonly capabilityId: string
  readonly author: string
  readonly note: string
}
