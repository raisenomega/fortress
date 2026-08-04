import type { OmegaGateVerdict } from './capability-gate'

/**
 * Capacidad que FORTRESS se crea a si misma a partir de una oportunidad
 * detectada: una funcion o una herramienta (reversibles) o un agente nuevo.
 * Nace a los 1.000 episodios, pasa por prueba y ciclo, y a los 50.000 es oficial.
 * Un episodio es una ejecucion real; el ciclo se mide en evidencia.
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

/**
 * Fila persistida. episodes/maturity se DERIVAN del historial; la fase APROBADA
 * si se guarda: promover exige aprobacion, no basta con acumular episodios.
 */
export interface StoredCapability extends NewCapability {
  readonly id: string
  readonly phase: CapabilityPhase
  readonly createdAt: string
}

/** A que fase puede saltar una capacidad y que la frena. Solo lectura, derivado. */
export interface Promotion {
  /** Hay episodios suficientes para saltar sobre la fase ya aprobada. */
  readonly eligible: boolean
  /** La fase a la que saltaria, o null si ya es oficial. */
  readonly to: CapabilityPhase | null
  /** Un agente nuevo exige aprobacion humana; una funcion o herramienta no. */
  readonly needsHuman: boolean
  /** OMEGA veta el salto por evidencia. */
  readonly blocked: boolean
}

/** Vista viva: la fila mas lo que se calcula del historial real de ejecuciones. */
export interface Capability extends StoredCapability {
  readonly episodes: number
  /** Puntaje de madurez derivado de evidencia real (0..OFFICIAL_AT). */
  readonly maturity: number
  /** Veredicto de OMEGA por evidencia: puede vetar la promocion, nunca aprobarla. */
  readonly omegaVeto: OmegaGateVerdict
  readonly promotion: Promotion
}
