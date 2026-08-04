import type { CapabilityPhase, NewCapability, StoredCapability } from './capability'

/**
 * Persistencia de las capacidades que FORTRESS se propone crear. Global: no
 * cuelga de un proyecto. Guarda la fila cruda y la fase APROBADA; los episodios
 * y la madurez se DERIVAN del historial real de ejecuciones, no se almacenan.
 */
export interface CapabilityRepository {
  /** Nace en 'propuesta': existir no es lo mismo que estar promovida. */
  add(capability: NewCapability): StoredCapability
  listAll(): readonly StoredCapability[]
  findById(id: string): StoredCapability | null
  /** Fija la fase aprobada tras un salto autorizado. */
  promote(id: string, phase: CapabilityPhase): void
}
