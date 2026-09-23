import type { Db } from './database'
import { createDismissalWrites, type DismissalWrites } from './dismissal-writes'
import { createAliasWrites } from './finding-alias-writes'
import { createLifecycleWrites, type LifecycleWrites } from './finding-lifecycle-writes'
import type { FindingInsert } from './finding-row'
import * as SQL from './finding-sql'
import { toTouch } from './finding-touch'

export interface FindingWrites extends DismissalWrites, LifecycleWrites {
  sync(projectId: string, rows: readonly FindingInsert[], conservados?: ReadonlySet<string>): void
}

/** Escrituras de findings. Cada una es indivisible por su cuenta. */
export function createFindingWrites(db: Db): FindingWrites {
  const insert = db.prepare(SQL.INSERT_FINDING)
  const touch = db.prepare(SQL.TOUCH_FINDING)
  const byIdentity = db.prepare(SQL.SELECT_BY_IDENTITY)
  const touchKeep = db.prepare(SQL.TOUCH_CONSERVANDO)
  const aliases = createAliasWrites(db)

  // Indivisible: a medio camino el proyecto contaria una mezcla de dos escaneos.
  // Lo que este escaneo NO nombro no se toca — se queda con su lastSeen viejo.
  const sync = db.transaction(
    (projectId: string, rows: readonly FindingInsert[], conservados: ReadonlySet<string>) => {
      for (const row of rows) {
        const exacta = byIdentity.get(projectId, row.identity) as { id: string } | undefined
        // Solo al fallar la clave exacta se mira el alias (ADR-101): la clave
        // que hoy lleva la superviviente queda tambien como alias, por si vuelve.
        const alias = exacta === undefined ? aliases.resolver(projectId, row.identity) : null
        if (alias !== null && alias.identity !== row.identity) aliases.registrar(projectId, alias.identity, alias.id, 'sync', row.at) // prettier-ignore
        const existing = exacta ?? alias
        if (!existing) insert.run(row)
        // La UNICA linea de esta pieza dentro de la transaccion: quien conserva
        // su marca se decidio antes, con git delante.
        else (conservados.has(existing.id) ? touchKeep : touch).run(toTouch(row, existing.id))
      }
    }
  )

  return {
    sync: (projectId, rows, conservados) => sync(projectId, rows, conservados ?? new Set()),
    ...createLifecycleWrites(db),
    ...createDismissalWrites(db)
  }
}
