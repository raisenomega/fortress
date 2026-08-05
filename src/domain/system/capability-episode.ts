/**
 * Un episodio de una capacidad: una resolucion REAL suya (un escenario que se
 * planteo y resolvio). Es la unidad de evidencia con la que madura. `outcome`
 * dice si la decision fue buena; los fallos descuentan su madurez y pueden vetar.
 */
export type EpisodeOutcome = 'ok' | 'fail'

export interface CapabilityEpisode {
  readonly id: string
  readonly capabilityId: string
  readonly outcome: EpisodeOutcome
  readonly summary: string
  readonly createdAt: string
}

export interface NewCapabilityEpisode {
  readonly capabilityId: string
  readonly outcome: EpisodeOutcome
  readonly summary: string
}

/** Episodios acumulados de una capacidad y cuantos fallaron. Evidencia real. */
export interface EpisodeTally {
  readonly episodes: number
  readonly failures: number
}
