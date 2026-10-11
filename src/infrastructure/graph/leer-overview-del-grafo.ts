import { GRAPH_BIN } from '@domain/connectors/graph-mcp'
import type { GrafoOverview } from '@domain/build/marco-de-grafo'
import { correrCliGrafo } from './correr-cli-grafo'

interface OverviewCrudo {
  total_nodes?: number
  total_edges?: number
  languages?: { language?: string; file_count?: number }[]
  clusters?: { label?: string; members?: number }[]
}

/**
 * Lee el OVERVIEW del grafo DENTRO del fence ya preparado del turno (`dir`),
 * pieza de AISLAMIENTO (Sello B.2). NO abre su propio fence: lo comparte con el
 * resto de lecturas del turno (ADR-095) —`leerGrafoDelTurno` prepara UNA sola
 * copia .db—. Las dos leyes del PASO 144 siguen: se lee de la COPIA, nunca el
 * indice real (el runner solo ve `dir`), y el error que enumera
 * `available_projects` lo cierra el fence de UN solo .db. Fallo -> null.
 */
export async function overviewSobreFence(
  dir: string,
  slug: string,
  owner: string
): Promise<GrafoOverview | null> {
  const args = { project: slug, aspects: ['overview'] }
  const salida = await correrCliGrafo(GRAPH_BIN, dir, 'get_architecture', args, owner)
  return salida === null ? null : parseOverview(salida)
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
