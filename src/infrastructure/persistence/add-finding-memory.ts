import { findingIdentity } from '@domain/project/finding-identity'
import { isSeverity } from '@domain/shared/severity'
import type { Db } from './database'

interface ColumnRow {
  readonly name: string
}

interface LegacyRow {
  readonly id: string
  readonly severity: string
  readonly title: string
  readonly file: string
  readonly line: number | null
  readonly created_at: string
}

/**
 * Columnas de la MEMORIA de un hallazgo. Se anaden sin CHECK porque SQLite no
 * lo admite en un ALTER; la validacion la hace el dominio al leer.
 */
const COLUMNS: ReadonlyArray<readonly [string, string]> = [
  ['identity', "ALTER TABLE findings ADD COLUMN identity TEXT NOT NULL DEFAULT ''"],
  ['lifecycle', "ALTER TABLE findings ADD COLUMN lifecycle TEXT NOT NULL DEFAULT 'ACTIVE'"],
  ['first_seen', "ALTER TABLE findings ADD COLUMN first_seen TEXT NOT NULL DEFAULT ''"],
  ['last_seen', "ALTER TABLE findings ADD COLUMN last_seen TEXT NOT NULL DEFAULT ''"],
  ['resolved_at', 'ALTER TABLE findings ADD COLUMN resolved_at TEXT'],
  ['extinct_reason', 'ALTER TABLE findings ADD COLUMN extinct_reason TEXT'],
  ['tipo', "ALTER TABLE findings ADD COLUMN tipo TEXT NOT NULL DEFAULT 'otro'"],
  ['simbolo', "ALTER TABLE findings ADD COLUMN simbolo TEXT NOT NULL DEFAULT ''"]
]

const PENDING = `SELECT id, severity, title, file, line, created_at FROM findings WHERE identity = ''`

const FILL = `UPDATE findings SET identity = @identity, first_seen = @at, last_seen = @at
  WHERE id = @id`

function hasColumn(db: Db, column: string): boolean {
  return (db.pragma('table_info(findings)') as ColumnRow[]).some((c) => c.name === column)
}

/**
 * Migra las filas que ya existen: les calcula su clave estable y les da una
 * historia. Las fechas salen de `created_at`, que es lo unico que la version
 * anterior guardaba — no se inventa una fecha mas reciente, que haria parecer
 * recien visto algo que lleva semanas.
 *
 * Idempotente: solo toca las filas sin clave, asi que repetirla no hace nada.
 *
 * La LINEA se lee de su columna y se le pasa de verdad. Hasta ADR-084 iba
 * `line: null` a proposito, porque la formula la ignoraba; con la linea dentro
 * de la clave, seguir pasando null daria `fichero│-│tipo` a estas filas y
 * `fichero│linea│tipo` a todas las demas — dos formulas conviviendo, y el
 * desajuste solo se veria como duplicados meses despues.
 */
export function addFindingMemory(db: Db): void {
  for (const [column, statement] of COLUMNS) {
    if (!hasColumn(db, column)) db.exec(statement)
  }

  const fill = db.prepare(FILL)
  const backfill = db.transaction((rows: readonly LegacyRow[]) => {
    for (const row of rows) {
      const severity = isSeverity(row.severity) ? row.severity : 'MEDIUM'
      const identity = findingIdentity({ ...row, severity })
      fill.run({ id: row.id, identity, at: row.created_at })
    }
  })

  backfill(db.prepare(PENDING).all() as LegacyRow[])
}
