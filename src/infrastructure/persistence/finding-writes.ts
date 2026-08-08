import { nowIso } from '@domain/shared/id'
import type { Db } from './database'
import type { FindingInsert } from './finding-row'
import * as SQL from './finding-sql'
import { toTouch } from './finding-touch'

type Located = { readonly project_id: string; readonly fingerprint: string } | undefined

export interface FindingWrites {
  sync(projectId: string, rows: readonly FindingInsert[]): void
  changeStatus(findingId: string, dismissed: boolean): boolean
  dismissedFingerprints(projectId: string): ReadonlySet<string>
}

/** Escrituras de findings. Cada una es indivisible por su cuenta. */
export function createFindingWrites(db: Db): FindingWrites {
  const insert = db.prepare(SQL.INSERT_FINDING)
  const touch = db.prepare(SQL.TOUCH_FINDING)
  const byIdentity = db.prepare(SQL.SELECT_BY_IDENTITY)
  const locate = db.prepare(SQL.SELECT_FINDING)
  const setStatus = db.prepare(SQL.SET_STATUS)
  const addDismissal = db.prepare(SQL.INSERT_DISMISSAL)
  const dropDismissal = db.prepare(SQL.DELETE_DISMISSAL)
  const dismissalsOf = db.prepare(SQL.SELECT_DISMISSALS)

  // Indivisible: a medio camino el proyecto contaria una mezcla de dos escaneos.
  // Lo que este escaneo NO nombro no se toca — se queda con su lastSeen viejo.
  const sync = db.transaction((projectId: string, rows: readonly FindingInsert[]) => {
    for (const row of rows) {
      const existing = byIdentity.get(projectId, row.identity) as { id: string } | undefined
      if (existing) touch.run(toTouch(row, existing.id))
      else insert.run(row)
    }
  })

  // El estado de la fila y el registro duradero del descarte van juntos, o el
  // descarte no sobreviviria al siguiente escaneo.
  const changeStatus = db.transaction((findingId: string, dismissed: boolean) => {
    const row = locate.get(findingId) as Located
    if (!row) return false

    setStatus.run(dismissed ? 'false_positive' : 'open', findingId)
    if (dismissed) addDismissal.run(row.project_id, row.fingerprint, nowIso())
    else dropDismissal.run(row.project_id, row.fingerprint)
    return true
  })

  return {
    sync,
    changeStatus,
    dismissedFingerprints: (projectId) =>
      new Set(
        (dismissalsOf.all(projectId) as Array<{ fingerprint: string }>).map(
          (row) => row.fingerprint
        )
      )
  }
}
