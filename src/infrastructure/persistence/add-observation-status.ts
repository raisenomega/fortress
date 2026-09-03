import type { Db } from './database'

interface ColumnRow {
  readonly name: string
}

/**
 * El estado de una observacion, de binario a tres valores. Sin CHECK porque
 * SQLite no lo admite en un ALTER; el dominio valida al leer, como el resto.
 */
const COLUMNS: ReadonlyArray<readonly [string, string]> = [
  ['status', "ALTER TABLE self_observations ADD COLUMN status TEXT NOT NULL DEFAULT 'pendiente'"],
  ['reason', 'ALTER TABLE self_observations ADD COLUMN reason TEXT'],
  ['attended_by', 'ALTER TABLE self_observations ADD COLUMN attended_by TEXT'],
  ['attended_at', 'ALTER TABLE self_observations ADD COLUMN attended_at TEXT']
]

const BACKFILL = `UPDATE self_observations SET status = 'atendido'
  WHERE resolved = 1 AND status = 'pendiente'`

function has(db: Db, column: string): boolean {
  return (db.pragma('table_info(self_observations)') as ColumnRow[]).some((c) => c.name === column)
}

/**
 * Amplia el estado del backlog de auto-mejora: `resolved` decia si algo estaba
 * hecho y nada mas; `status` dice ademas si se DESCARTO, y las tres columnas que
 * lo acompanan dicen quien y por que. Un descarte sin motivo es justo lo que
 * esto viene a impedir.
 *
 * Aditiva del caso normal (ADR-036): `ALTER TABLE ADD COLUMN` verificando la
 * ausencia, con default en el lado seguro —`pendiente`, que no afirma que nadie
 * la haya mirado—. Una base antigua abre igual.
 *
 * El backfill traduce lo que el estado viejo sabia. HOY no mueve ni una fila:
 * el boton de marcar existe desde hace semanas y no se uso una sola vez. Se
 * escribe igual, porque una migracion que solo funciona con los datos de hoy
 * no es una migracion, y el `AND status = 'pendiente'` la hace idempotente:
 * correrla dos veces no pisa un estado que alguien ya cambio.
 */
export function addObservationStatus(db: Db): void {
  for (const [column, statement] of COLUMNS) {
    if (!has(db, column)) db.exec(statement)
  }
  db.exec(BACKFILL)
}
