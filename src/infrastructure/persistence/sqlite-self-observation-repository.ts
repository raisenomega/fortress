import { newId, nowIso } from '@domain/shared/id'
import type { ObservationKind, ObservationStatus, SelfObservation } from '@domain/system/self-observation' // prettier-ignore
import type { SelfObservationRepository } from '@domain/system/self-observation-repository'
import type { Db } from './database'

interface Row {
  readonly id: string
  readonly source_project: string
  readonly kind: string
  readonly area: string
  readonly note: string
  readonly status: string
  readonly reason: string | null
  readonly attended_by: string | null
  readonly attended_at: string | null
  readonly created_at: string
}

/** `resolved` no se lee: sigue en la tabla por ADR-036, no en el modelo. */
function toObs(row: Row): SelfObservation {
  return {
    id: row.id,
    sourceProject: row.source_project,
    kind: row.kind as ObservationKind,
    area: row.area,
    note: row.note,
    status: row.status as ObservationStatus,
    reason: row.reason,
    attendedBy: row.attended_by,
    attendedAt: row.attended_at,
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
  const open = db.prepare(
    "SELECT * FROM self_observations WHERE status = 'pendiente' ORDER BY created_at DESC"
  )
  // Por `attended_at` y no por `created_at`: lo que importa es cuando se CERRO,
  // que es lo reciente para quien va a leerlo, no cuando se observo.
  // Los dos desempates los exige el puerto: sin ellos una tanda empata en masa
  // y el LIMIT corta por donde la base quiera. Ver `listClosed`.
  const closed = db.prepare(
    `SELECT * FROM self_observations WHERE status != 'pendiente'
     ORDER BY attended_at DESC, created_at DESC, id LIMIT ?`
  )
  const update = db.prepare(`UPDATE self_observations
    SET status = @status, reason = @reason, attended_by = @attendedBy, attended_at = @attendedAt
    WHERE id = @id`)

  const setStatus = (entrada: Parameters<SelfObservationRepository['setStatus']>[0]): boolean =>
    update.run(entrada).changes > 0

  return {
    add: (o) => {
      const id = newId()
      insert.run(id, o.sourceProject, o.kind, o.area, o.note, nowIso())
      return toObs(byId.get(id) as Row)
    },
    listOpen: () => (open.all() as Row[]).map(toObs),
    listClosed: (limite) => (closed.all(limite) as Row[]).map(toObs),
    findById: (id) => {
      const row = byId.get(id) as Row | undefined
      return row ? toObs(row) : null
    },
    setStatus
  }
}
