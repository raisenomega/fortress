import type { AppContext } from '@application/context'
import { isFortressRepo, selfProject } from '../system/self-project'
import { readGraphIndex } from './read-graph-index'

/**
 * Ruta del repo de FORTRESS: la registrada como proyecto (funciona tambien en la
 * app empaquetada), o la propia en dev via selfProject(). null si no se ubica.
 */
function fortressPath(context: AppContext): string | null {
  const registered = context.projects.list().find((project) => isFortressRepo(project.path))
  return registered?.path ?? selfProject()?.path ?? null
}

/**
 * ¿Falta el grafo indexado del repo de FORTRESS? Si no se puede ubicar el repo
 * (empaquetado y sin registrarlo como proyecto), NO bloquea: mejor permitir que
 * romper la auto-mejora por no encontrar la ruta.
 */
export function selfGraphMissing(context: AppContext): boolean {
  const path = fortressPath(context)
  if (path === null) return false
  return readGraphIndex(path) === null
}
