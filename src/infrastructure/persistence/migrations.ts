import type { Db } from './database'

interface ColumnRow {
  readonly name: string
}

function hasColumn(db: Db, table: string, column: string): boolean {
  const columns = db.pragma(`table_info(${table})`) as ColumnRow[]
  return columns.some((entry) => entry.name === column)
}

/**
 * Migraciones aditivas para bases que ya existen en el equipo del operador.
 * El esquema base es idempotente (CREATE IF NOT EXISTS), pero eso no anade
 * columnas nuevas a una tabla creada por una version anterior.
 *
 * Los nombres de tabla y columna son literales del codigo, nunca input.
 */
export function runMigrations(db: Db): void {
  if (!hasColumn(db, 'chat_messages', 'engine')) {
    db.exec("ALTER TABLE chat_messages ADD COLUMN engine TEXT NOT NULL DEFAULT 'api'")
  }
}
