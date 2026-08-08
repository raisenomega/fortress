import type { QualityHistoryRepository, QualityRecord } from '@domain/score/quality-record'
import { newId, nowIso } from '@domain/shared/id'
import type { Db } from './database'

const COLS = `id, project_id, global, partial, dim_seguridad, dim_correctitud, dim_tests,
  dim_mantenibilidad, dim_dependencias, dim_operacion, at`

interface Row {
  readonly id: string
  readonly project_id: string
  readonly global: number
  readonly partial: number
  readonly dim_seguridad: number | null
  readonly dim_correctitud: number | null
  readonly dim_tests: number | null
  readonly dim_mantenibilidad: number | null
  readonly dim_dependencias: number | null
  readonly dim_operacion: number | null
  readonly at: string
}

function toRecord(r: Row): QualityRecord {
  return {
    id: r.id,
    projectId: r.project_id,
    global: r.global,
    partial: r.partial === 1,
    dimensions: {
      seguridad: r.dim_seguridad,
      correctitud: r.dim_correctitud,
      tests: r.dim_tests,
      mantenibilidad: r.dim_mantenibilidad,
      dependencias: r.dim_dependencias,
      operacion: r.dim_operacion
    },
    at: r.at
  }
}

export function createSqliteQualityHistoryRepository(db: Db): QualityHistoryRepository {
  const insert = db.prepare(`INSERT INTO quality_scans (${COLS}) VALUES (@id, @projectId, @global,
    @partial, @seguridad, @correctitud, @tests, @mantenibilidad, @dependencias, @operacion, @at)`)
  const byProject = db.prepare(
    `SELECT ${COLS} FROM quality_scans WHERE project_id = ? ORDER BY at DESC LIMIT ?`
  )
  return {
    record: (projectId, global, partial, dims) =>
      insert.run({
        id: newId(),
        projectId,
        global,
        partial: partial ? 1 : 0,
        at: nowIso(),
        ...dims
      }),
    listByProject: (projectId, limit) => (byProject.all(projectId, limit) as Row[]).map(toRecord)
  }
}
