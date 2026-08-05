import type { CapabilityEpisode, EpisodeTally, NewCapabilityEpisode } from './capability-episode'

/** Persistencia de los episodios (resoluciones) de cada capacidad. Solo datos. */
export interface CapabilityEpisodeRepository {
  record(episode: NewCapabilityEpisode): CapabilityEpisode
  /** Ultimos episodios de una capacidad, del mas reciente al mas antiguo. */
  listFor(capabilityId: string, limit: number): readonly CapabilityEpisode[]
  /** Cuenta y fallos de una capacidad: la evidencia que deriva fase y madurez. */
  tallyFor(capabilityId: string): EpisodeTally
}
