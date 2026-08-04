import type { NewOmegaEntry, OmegaEntry } from './omega-entry'

/**
 * El Libro de la Vida. Solo se anexa y se lee: NO existe borrar ni editar, a
 * proposito. La ley "el registro es eterno" no se confia a la disciplina del
 * codigo; se hace imposible de violar quitando el metodo del puerto.
 */
export interface OmegaLog {
  append(entry: NewOmegaEntry): OmegaEntry
  list(limit: number): readonly OmegaEntry[]
  listByProject(projectId: string, limit: number): readonly OmegaEntry[]
}
