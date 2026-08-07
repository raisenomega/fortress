import { isConfigState } from '@domain/project/config-state'
import { normalizeScore } from '@domain/project/fortress-score'
import type { Project } from '@domain/project/project'

/** Fila cruda de la tabla projects. SQLite no tiene boolean: usa 0/1. */
export interface ProjectRow {
  readonly id: string
  readonly name: string
  readonly path: string
  readonly stack: string
  readonly git_remote: string | null
  readonly git_branch: string | null
  readonly fortress_score: number
  readonly general_quality: number | null
  readonly last_scan: string | null
  readonly has_claude: number
  readonly has_graph: number
  readonly graph_nodes: number | null
  readonly graph_edges: number | null
  readonly graph_indexed_at: string | null
  readonly has_fortress: number
  readonly trusted: number
  readonly loop_enabled: number
  readonly config_state: string
  readonly created_at: string
}

export function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    path: row.path,
    stack: row.stack,
    gitRemote: row.git_remote,
    gitBranch: row.git_branch,
    fortressScore: normalizeScore(row.fortress_score),
    generalQuality: row.general_quality === null ? null : normalizeScore(row.general_quality),
    lastScan: row.last_scan,
    hasClaude: row.has_claude === 1,
    hasGraph: row.has_graph === 1,
    graphNodes: row.graph_nodes,
    graphEdges: row.graph_edges,
    graphIndexedAt: row.graph_indexed_at,
    hasFortress: row.has_fortress === 1,
    trusted: row.trusted === 1,
    loopEnabled: row.loop_enabled === 1,
    configState: isConfigState(row.config_state) ? row.config_state : 'CONFIGURADO',
    createdAt: row.created_at
  }
}
