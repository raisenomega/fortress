import type { GraphStats } from '@domain/graph/graph-status'
import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'

/**
 * `has_graph` dice si el indice EXISTE, y se alinea con el disco cada vez que
 * se mira. Lo escribia solo el boton de instalar y el reindex nunca lo tocaba:
 * estaba en 0 en seis proyectos con indice y en 1 en el unico sin el (mailbd,
 * cuya cache renacio el 2026-08-29 sin que nadie lo viera).
 */
export function alinearBandera(
  context: AppContext,
  project: Project,
  indice: GraphStats | null
): void {
  if (indice === null) context.projects.clearGraph(project.id)
  else context.projects.setGraph(project.id, indice.nodes, indice.edges, indice.indexedAt ?? new Date().toISOString()) // prettier-ignore
}
