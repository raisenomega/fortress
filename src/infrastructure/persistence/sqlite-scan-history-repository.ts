import type { ScanHistoryRepository, ScanRecord } from '@domain/scan/scan-record'
import { newId } from '@domain/shared/id'
import type { Db } from './database'

const COLUMNS = 'id, project_id, score, finding_count, critical_count, duration_ms, at'

interface ScanRow {
  readonly id: string
  readonly project_id: string
  readonly score: number
  readonly finding_count: number
  readonly critical_count: number
  readonly duration_ms: number
  readonly at: string
}

function toRecord(row: ScanRow): ScanRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    score: row.score,
    findingCount: row.finding_count,
    criticalCount: row.critical_count,
    durationMs: row.duration_ms,
    at: row.at
  }
}

export function createSqliteScanHistoryRepository(db: Db): ScanHistoryRepository {
  const insert = db.prepare(
    `INSERT INTO scans (${COLUMNS})
     VALUES (@id, @projectId, @score, @findingCount, @criticalCount, @durationMs, @at)`
  )
  const byProject = db.prepare(
    `SELECT ${COLUMNS} FROM scans WHERE project_id = ? ORDER BY at DESC LIMIT ?`
  )
  const since = db.prepare(`SELECT ${COLUMNS} FROM scans WHERE at >= ? ORDER BY at ASC`)

  return {
    record: (scan) => {
      const id = newId()
      insert.run({ id, ...scan })
      return { id, ...scan }
    },

    listByProject: (projectId, limit) =>
      (byProject.all(projectId, limit) as ScanRow[]).map(toRecord),

    listSince: (from) => (since.all(from) as ScanRow[]).map(toRecord)
  }
}
