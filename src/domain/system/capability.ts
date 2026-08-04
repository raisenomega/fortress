/**
 * Capacidad que FORTRESS se crea a si misma a partir de una oportunidad
 * detectada: una funcion o una herramienta (reversibles) o un agente nuevo.
 * Nace a los 1.000 episodios, pasa por prueba y ciclo, y a los 50.000 episodios
 * es oficial. Un episodio es una ejecucion real; el ciclo se mide en evidencia.
 */
export type CapabilityKind = 'funcion' | 'herramienta' | 'agente'

export type CapabilityPhase = 'propuesta' | 'prueba' | 'ciclo' | 'oficial'

/** Episodios (ejecuciones reales) que marcan cada salto del ciclo de vida. */
export const CREATE_AT = 1_000
export const TRIAL_END = 20_000
export const OFFICIAL_AT = 50_000

/** Lo que aporta quien propone la capacidad; id y fecha los pone la base. */
export interface NewCapability {
  readonly kind: CapabilityKind
  readonly name: string
  /** La observacion de oportunidad de la que nacio. */
  readonly originObservation: string
}

/** Fila persistida. episodes/phase/maturity NO se guardan: se derivan. */
export interface StoredCapability extends NewCapability {
  readonly id: string
  readonly createdAt: string
}

/** Vista viva: la fila mas lo que se calcula del historial real de ejecuciones. */
export interface Capability extends StoredCapability {
  readonly episodes: number
  readonly phase: CapabilityPhase
  /** Puntaje de madurez derivado de evidencia real (0..OFFICIAL_AT). */
  readonly maturity: number
}
