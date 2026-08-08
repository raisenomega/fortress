import { normalizeScore } from '@domain/project/fortress-score'
import type { DimensionScores } from '@domain/score/dimension'
import { nowIso } from '@domain/shared/id'
import type { Db } from './database'

const GRAPH_SQL = `UPDATE projects SET has_graph = 1, graph_nodes = ?, graph_edges = ?,
  graph_indexed_at = ? WHERE id = ?`
const QUALITY_SQL = `UPDATE projects SET general_quality = ?, quality_partial = ?, dim_seguridad = ?,
  dim_correctitud = ?, dim_tests = ?, dim_mantenibilidad = ?, dim_dependencias = ?,
  dim_operacion = ? WHERE id = ?`
const CONTAMINATE_SQL = `UPDATE projects SET contaminated_at = ?, contamination_detail = ?
  WHERE id = ?`

export interface ExtraWrites {
  setGraph: (id: string, nodes: number, edges: number, indexedAt: string) => void
  setQuality: (id: string, global: number, dims: DimensionScores, partial: boolean) => void
  markContaminated: (id: string, detail: string) => void
}

/** Los writers grandes de projects (grafo + score integral), fuera del repo por tamano. */
export function makeExtraWrites(db: Db): ExtraWrites {
  const graph = db.prepare(GRAPH_SQL)
  const quality = db.prepare(QUALITY_SQL)
  const contaminate = db.prepare(CONTAMINATE_SQL)
  return {
    setGraph: (id, nodes, edges, indexedAt) => graph.run(nodes, edges, indexedAt, id),
    markContaminated: (id, detail) => contaminate.run(nowIso(), detail, id),
    setQuality: (id, global, dims, partial) =>
      quality.run(
        normalizeScore(global),
        partial ? 1 : 0,
        dims.seguridad,
        dims.correctitud,
        dims.tests,
        dims.mantenibilidad,
        dims.dependencias,
        dims.operacion,
        id
      )
  }
}
