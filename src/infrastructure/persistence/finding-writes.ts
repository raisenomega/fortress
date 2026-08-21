import type { Db } from './database'
import { createDismissalWrites, type DismissalWrites } from './dismissal-writes'
import type { FindingInsert } from './finding-row'
import * as SQL from './finding-sql'
import { toTouch } from './finding-touch'

export interface FindingWrites extends DismissalWrites {
  sync(projectId: string, rows: readonly FindingInsert[]): void
  markExtinct(ids: readonly string[], at: string): void
  markMitigated(findingId: string, note: string, at: string): boolean
}

/** Escrituras de findings. Cada una es indivisible por su cuenta. */
export function createFindingWrites(db: Db): FindingWrites {
  const insert = db.prepare(SQL.INSERT_FINDING)
  const touch = db.prepare(SQL.TOUCH_FINDING)
  const extinguish = db.prepare(SQL.MARK_EXTINCT)
  const byIdentity = db.prepare(SQL.SELECT_BY_IDENTITY)
  const mitigate = db.prepare(SQL.MARK_MITIGATED)

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

  // Devuelve si marco algo: el WHERE exige ACTIVE, asi que un hallazgo ya
  // extinto o ya mitigado no se toca y el operador se entera en vez de creer
  // que lo hizo.
  const markMitigated = (findingId: string, note: string, at: string): boolean =>
    mitigate.run({ id: findingId, note, at }).changes > 0

  return { sync, markExtinct, markMitigated, ...createDismissalWrites(db) }
}
