/** Un escaneo terminado. Se guardan todos: la tendencia necesita historia. */
export interface ScanRecord {
  readonly id: string
  readonly projectId: string
  readonly score: number
  readonly findingCount: number
  readonly criticalCount: number
  readonly durationMs: number
  readonly at: string
}

export type NewScanRecord = Omit<ScanRecord, 'id'>

/** Puerto del historico de escaneos. */
export interface ScanHistoryRepository {
  record(scan: NewScanRecord): ScanRecord
  /** Del mas reciente al mas antiguo. */
  listByProject(projectId: string, limit: number): readonly ScanRecord[]
  /** Todos los proyectos a la vez, para las graficas del dashboard. */
  listSince(since: string): readonly ScanRecord[]
}
