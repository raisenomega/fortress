import { newId, nowIso } from '@domain/shared/id'
import type { ObservationKind, SelfObservation } from '@domain/system/self-observation'
import type { SelfObservationRepository } from '@domain/system/self-observation-repository'
import type { Db } from './database'

interface Row {
  readonly id: string
  readonly source_project: string
  readonly kind: string
  readonly area: string
  readonly note: string
  readonly resolved: number
  readonly created_at: string
}

function toObs(row: Row): SelfObservation {
  return {
    id: row.id,
    sourceProject: row.source_project,
    kind: row.kind as ObservationKind,
    area: row.area,
    note: row.note,
    resolved: row.resolved === 1,
    createdAt: row.created_at
  }
}

/** Backlog de auto-mejora de FORTRESS. Parametrizado; sin cascada de proyectos. */
export function createSqliteSelfObservationRepository(db: Db): SelfObservationRepository {
  const insert = db.prepare(
    `INSERT INTO self_observations (id, source_project, kind, area, note, resolved, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`
  )
  const byId = db.prepare('SELECT * FROM self_observations WHERE id = ?')
  const open = db.prepare('SELECT * FROM self_observations WHERE resolved = 0 ORDER BY created_at DESC')
  const markResolved = db.prepare('UPDATE self_observations SET resolved = 1 WHERE id = ?')

  return {
    add: (o) => {
      const id = newId()
      insert.run(id, o.sourceProject, o.kind, o.area, o.note, nowIso())
      return toObs(byId.get(id) as Row)
    },
    listOpen: () => (open.all() as Row[]).map(toObs),
    resolve: (id) => {
      markResolved.run(id)
    }
  }
}
