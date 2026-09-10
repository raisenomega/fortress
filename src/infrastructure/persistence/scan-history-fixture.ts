import type { CierreDeScan, ScanHistoryRepository } from '@domain/scan/scan-history-repository'
import type { ScanRecord } from '@domain/scan/scan-record'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteScanHistoryRepository } from './sqlite-scan-history-repository'

export const PROYECTO = 'p1'

/** Health Flow, que es el escaneo que motivo la pieza: 12 paradas, 2.108 ficheros. */
export const APERTURA = {
  projectId: PROYECTO,
  startedAt: '2026-09-09T20:00:00Z',
  paradasTotal: 12,
  ficherosTotal: 2108
} as const

export const CIERRE: CierreDeScan = {
  estado: 'CERRADO',
  score: 41,
  findingCount: 23,
  dossierCount: 31,
  criticalCount: 1,
  durationMs: 5_400_000,
  paradasHechas: 12,
  ficherosCubiertos: 2108,
  motivoCierre: 'completo',
  at: '2026-09-09T21:30:00Z'
}

export interface Bench {
  readonly repo: ScanHistoryRepository
  /** La fila tal y como quedo en la base, releida por el puerto. */
  releer(): ScanRecord
  filas(): number
}

export function crearBench(): Bench {
  const db = createMemoryDb()
  seedProject(db, PROYECTO)
  const repo = createSqliteScanHistoryRepository(db)

  return {
    repo,
    releer: () => repo.listByProject(PROYECTO, 10)[0],
    filas: () => repo.listByProject(PROYECTO, 100).length
  }
}
