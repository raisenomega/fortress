/** Un escaneo terminado. Se guardan todos: la tendencia necesita historia. */
export interface ScanRecord {
  readonly id: string
  readonly projectId: string
  readonly score: number
  /** Los que la corrida REPORTO. No es lo que puntua el score. */
  readonly findingCount: number
  /**
   * Sobre cuantos hallazgos se calculo el score: los reportados MAS los que
   * seguian vivos sin que este escaneo los nombrara. Es lo que hace legible un
   * "score 0 con 4 hallazgos" — el 0 sale de setenta y dos, no de cuatro.
   * Cero en las filas anteriores a que esto se guardara: no consta.
   */
  readonly dossierCount: number
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
