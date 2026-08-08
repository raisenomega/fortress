import type { DimensionScores } from './dimension'

/** Una auditoria de calidad terminada. Se guardan todas: la tendencia necesita historia. */
export interface QualityRecord {
  readonly id: string
  readonly projectId: string
  readonly global: number
  readonly partial: boolean
  readonly dimensions: DimensionScores
  readonly at: string
}

/** Puerto del historico de auditorias de calidad (tendencia por dimension). */
export interface QualityHistoryRepository {
  record(projectId: string, global: number, partial: boolean, dims: DimensionScores): void
  /** Del mas reciente al mas antiguo. */
  listByProject(projectId: string, limit: number): readonly QualityRecord[]
}
