import type { Db } from './database'
import { createDismissalWrites, type DismissalWrites } from './dismissal-writes'
import type { FindingInsert } from './finding-row'
import * as SQL from './finding-sql'
import { toTouch } from './finding-touch'

export interface FindingWrites extends DismissalWrites {
  sync(projectId: string, rows: readonly FindingInsert[], conservados?: ReadonlySet<string>): void
  markExtinct(ids: readonly string[], at: string, motivo: string): void
  markMitigated(findingId: string, note: string, at: string): boolean
  markActive(findingId: string): boolean
}

/** Escrituras de findings. Cada una es indivisible por su cuenta. */
export function createFindingWrites(db: Db): FindingWrites {
  const insert = db.prepare(SQL.INSERT_FINDING)
  const touch = db.prepare(SQL.TOUCH_FINDING)
  const extinguish = db.prepare(SQL.MARK_EXTINCT)
  const byIdentity = db.prepare(SQL.SELECT_BY_IDENTITY)
  const mitigate = db.prepare(SQL.MARK_MITIGATED)
  const activate = db.prepare(SQL.MARK_ACTIVE)
  const touchKeep = db.prepare(SQL.TOUCH_CONSERVANDO)

  // Indivisible: a medio camino el proyecto contaria una mezcla de dos escaneos.
  // Lo que este escaneo NO nombro no se toca — se queda con su lastSeen viejo.
  const sync = db.transaction(
    (projectId: string, rows: readonly FindingInsert[], conservados: ReadonlySet<string>) => {
      for (const row of rows) {
        const existing = byIdentity.get(projectId, row.identity) as { id: string } | undefined
        if (!existing) insert.run(row)
        // La UNICA linea de esta pieza dentro de la transaccion: quien conserva
        // su marca se decidio antes, con git delante.
        else (conservados.has(existing.id) ? touchKeep : touch).run(toTouch(row, existing.id))
      }
    }
  )

  // Indivisible: media tanda dejaria el registro diciendo que unos problemas se
  // cerraron y otros no. El motivo va con cada fila, no en un log aparte.
  const markExtinct = db.transaction((ids: readonly string[], at: string, motivo: string) => {
    for (const id of ids) extinguish.run({ id, at, motivo })
  })

  // Devuelve si marco algo: el WHERE exige ACTIVE, asi que un hallazgo ya
  // extinto o ya mitigado no se toca y el operador se entera en vez de creer
  // que lo hizo.
  const markMitigated = (findingId: string, note: string, at: string): boolean =>
    mitigate.run({ id: findingId, note, at }).changes > 0

  const markActive = (findingId: string): boolean => activate.run({ id: findingId }).changes > 0

  return {
    sync: (projectId, rows, conservados) => sync(projectId, rows, conservados ?? new Set()),
    markExtinct,
    markMitigated,
    markActive,
    ...createDismissalWrites(db)
  }
}
