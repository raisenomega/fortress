import type { Db } from './database'

interface ColumnRow {
  readonly name: string
}

/** Guard de idempotencia de los ALTER: nombres SIEMPRE literales, nunca input. */
export function hasColumn(db: Db, table: string, column: string): boolean {
  const columns = db.pragma(`table_info(${table})`) as ColumnRow[]
  return columns.some((entry) => entry.name === column)
}
