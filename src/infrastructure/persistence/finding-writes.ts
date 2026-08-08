import type { Db } from './database'
import { createDismissalWrites, type DismissalWrites } from './dismissal-writes'
import type { FindingInsert } from './finding-row'
import * as SQL from './finding-sql'
import { toTouch } from './finding-touch'

export interface FindingWrites extends DismissalWrites {
  sync(projectId: string, rows: readonly FindingInsert[]): void
  markExtinct(ids: readonly string[], at: string): void
}

/** Escrituras de findings. Cada una es indivisible por su cuenta. */
export function createFindingWrites(db: Db): FindingWrites {
  const insert = db.prepare(SQL.INSERT_FINDING)
  const touch = db.prepare(SQL.TOUCH_FINDING)
  const extinguish = db.prepare(SQL.MARK_EXTINCT)
  const byIdentity = db.prepare(SQL.SELECT_BY_IDENTITY)

  // Indivisible: a medio camino el proyecto contaria una mezcla de dos escaneos.
  // Lo que este escaneo NO nombro no se toca — se queda con su lastSeen viejo.
  const sync = db.transaction((projectId: string, rows: readonly FindingInsert[]) => {
    for (const row of rows) {
      const existing = byIdentity.get(projectId, row.identity) as { id: string } | undefined
      if (existing) touch.run(toTouch(row, existing.id))
      else insert.run(row)
    }
  })

  // Todas las extinciones de un escaneo entran juntas: media tanda dejaria el
  // registro diciendo que unos problemas se cerraron y otros no, sin motivo.
  const markExtinct = db.transaction((ids: readonly string[], at: string) => {
    for (const id of ids) extinguish.run({ id, at })
  })

  return { sync, markExtinct, ...createDismissalWrites(db) }
}
