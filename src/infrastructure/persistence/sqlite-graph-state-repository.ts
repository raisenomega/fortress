import type { GraphState, GraphStateRepository } from '@domain/graph/graph-state'
import type { GraphIndexingStatus } from '@domain/graph/reindex-decision'
import type { Db } from './database'

interface Row {
  readonly graph_indexed_at_sha: string | null
  readonly graph_indexed_at_ts: number | null
  readonly graph_indexing_status: string | null
  readonly graph_indexing_started_at: number | null
  readonly graph_indexing_error: string | null
}

const VACIO: GraphState = { indexedSha: null, indexedAt: null, status: 'IDLE', startedAt: null, error: null } // prettier-ignore

/** Estado de indexado del grafo, sobre columnas aditivas de projects. */
export function createSqliteGraphStateRepository(db: Db): GraphStateRepository {
  const select = db.prepare(`SELECT graph_indexed_at_sha, graph_indexed_at_ts,
    graph_indexing_status, graph_indexing_started_at, graph_indexing_error
    FROM projects WHERE id = ?`)
  const running = db.prepare(`UPDATE projects SET graph_indexing_status = 'RUNNING',
    graph_indexing_started_at = ?, graph_indexing_error = NULL WHERE id = ?`)
  const success = db.prepare(`UPDATE projects SET graph_indexing_status = 'IDLE',
    graph_indexed_at_sha = ?, graph_indexed_at_ts = ?, graph_indexing_started_at = NULL,
    graph_indexing_error = NULL WHERE id = ?`)
  const failure = db.prepare(`UPDATE projects SET graph_indexing_status = 'ERROR',
    graph_indexing_error = ?, graph_indexing_started_at = NULL WHERE id = ?`)

  return {
    getGraphState: (projectId) => {
      const row = select.get(projectId) as Row | undefined
      if (!row) return VACIO
      return {
        indexedSha: row.graph_indexed_at_sha,
        indexedAt: row.graph_indexed_at_ts,
        status: (row.graph_indexing_status ?? 'IDLE') as GraphIndexingStatus,
        startedAt: row.graph_indexing_started_at,
        error: row.graph_indexing_error
      }
    },
    markRunning: (projectId, startedAt) => void running.run(startedAt, projectId),
    markSuccess: (projectId, sha, at) => void success.run(sha, at, projectId),
    // El `at` del puerto no se persiste: el momento del fallo no tiene columna.
    markError: (projectId, error) => void failure.run(error, projectId)
  }
}
