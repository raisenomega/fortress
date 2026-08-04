import type { NewCapability, StoredCapability } from './capability'

/**
 * Persistencia de las capacidades que FORTRESS se propone crear. Global: no
 * cuelga de un proyecto. Solo guarda la fila cruda; los episodios, la fase y la
 * madurez se DERIVAN del historial real de ejecuciones, no se almacenan aqui.
 */
export interface CapabilityRepository {
  add(capability: NewCapability): StoredCapability
  listAll(): readonly StoredCapability[]
  findById(id: string): StoredCapability | null
}
