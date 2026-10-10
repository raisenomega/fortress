import { GRAPH_BIN } from '@domain/connectors/graph-mcp'
import type { GrafoOverview } from '@domain/build/marco-de-grafo'
import { graphSlug } from '@domain/graph/graph-slug'
import type { Project } from '@domain/project/project'
import { correrCliGrafo } from './correr-cli-grafo'
import { prepararGrafoDelTurno } from './grafo-del-turno'

interface OverviewCrudo {
  total_nodes?: number
  total_edges?: number
  languages?: { language?: string; file_count?: number }[]
  clusters?: { label?: string; members?: number }[]
}

/**
 * Lee el OVERVIEW del grafo del proyecto anclado (Sello B.2), pieza de
 * AISLAMIENTO. Las dos leyes del PASO 144: la lectura abre el .db en WAL -> se
 * lee una COPIA (el fence del turno, ADR-095), nunca el indice real; y el error
 * del binario enumera `available_projects` -> el fence de UN solo .db lo cierra
 * por construccion. Sin grafo (hasGraph=0) o ante cualquier fallo: null
 * (fail-safe). Determinista, $0, sin red, sin mutar el indice real.
 */
export async function leerOverviewDelGrafo(project: Project): Promise<GrafoOverview | null> {
  if (!project.hasGraph) return null
  const turno = await prepararGrafoDelTurno(project.path)
  try {
    const args = { project: graphSlug(project.path), aspects: ['overview'] }
    const salida = await correrCliGrafo(GRAPH_BIN, turno.dir, 'get_architecture', args, project.id)
    return salida === null ? null : parseOverview(salida)
  } finally {
    turno.liberar()
  }
}

/** El JSON crudo del binario -> el tipo del dominio. Sin `total_nodes` (p.ej. un
 *  `{"error":...}`) o JSON roto: null. JAMAS se arma nada con available_projects. */
export function parseOverview(salida: string): GrafoOverview | null {
  let j: OverviewCrudo
  try {
    j = JSON.parse(salida) as OverviewCrudo
  } catch {
    return null
  }
  if (typeof j.total_nodes !== 'number' || typeof j.total_edges !== 'number') return null
  return {
    nodes: j.total_nodes,
    edges: j.total_edges,
    languages: (j.languages ?? []).map((l) => ({ name: l.language ?? '?', files: l.file_count ?? 0 })), // prettier-ignore
    clusters: (j.clusters ?? []).map((c) => ({ label: c.label ?? '?', members: c.members ?? 0 }))
  }
}
