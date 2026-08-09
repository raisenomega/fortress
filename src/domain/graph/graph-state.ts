import type { GraphIndexingStatus } from './reindex-decision'

/** Estado persistido del indice del grafo de un proyecto. */
export interface GraphState {
  readonly indexedSha: string | null
  readonly indexedAt: number | null
  readonly status: GraphIndexingStatus
  readonly startedAt: number | null
  readonly error: string | null
}

/** Lo que el chip de la UI necesita: el estado MAS el HEAD vivo para comparar. */
export interface ReindexSnapshot extends GraphState {
  readonly currentSha: string | null
}

/** Puerto del estado de indexado. Infra lo implementa sobre la tabla projects. */
export interface GraphStateRepository {
  getGraphState(projectId: string): GraphState
  /** Marca la corrida en curso y limpia el error anterior. */
  markRunning(projectId: string, startedAt: number): void
  markSuccess(projectId: string, sha: string, at: number): void
  markError(projectId: string, error: string, at: number): void
}
