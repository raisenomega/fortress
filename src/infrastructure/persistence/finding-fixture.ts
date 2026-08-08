import type { FindingRepository } from '@domain/project/finding-repository'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { Db } from './database'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteFindingRepository } from './sqlite-finding-repository'

export const PROJECT = 'p1'

/** Los dos hallazgos reales que motivaron esta pieza. */
export const SSRF: DetectedFinding = {
  severity: 'MEDIUM',
  title: 'SSRF: el filtro de host privado no valida la IP resuelta por DNS',
  file: 'src/domain/posture/target-url.ts',
  line: 33
}
export const API_KEY: DetectedFinding = {
  severity: 'LOW',
  title: 'La API key del entorno se hereda a los scripts',
  file: 'src/infrastructure/probe/run-command.ts',
  line: 22
}

export interface Bench {
  readonly db: Db
  readonly repo: FindingRepository
  /** Cuantas FILAS hay de verdad, mire quien mire. */
  rows(): number
  memoryOf(title: string): ReturnType<FindingRepository['listMemory']>[number] | undefined
}

export function createBench(): Bench {
  const db = createMemoryDb()
  seedProject(db, PROJECT)
  const repo = createSqliteFindingRepository(db)

  return {
    db,
    repo,
    rows: () => (db.prepare('SELECT COUNT(*) AS n FROM findings').get() as { n: number }).n,
    memoryOf: (title) => repo.listMemory(PROJECT).find((entry) => entry.title === title)
  }
}
