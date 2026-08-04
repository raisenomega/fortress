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
/**
 * Columnas nuevas de findings. Se anaden sin CHECK porque SQLite no lo admite
 * en un ALTER; la validacion la hace el dominio al leer (isFindingStatus).
 * severity si conserva su CHECK: es la que decide si un push se bloquea.
 */
const FINDING_COLUMNS: ReadonlyArray<readonly [string, string]> = [
  ['fingerprint', "ALTER TABLE findings ADD COLUMN fingerprint TEXT NOT NULL DEFAULT ''"],
  ['status', "ALTER TABLE findings ADD COLUMN status TEXT NOT NULL DEFAULT 'open'"],
  ['scan_id', 'ALTER TABLE findings ADD COLUMN scan_id TEXT']
]

export function runMigrations(db: Db): void {
  if (!hasColumn(db, 'chat_messages', 'engine')) {
    db.exec("ALTER TABLE chat_messages ADD COLUMN engine TEXT NOT NULL DEFAULT 'api'")
  }

  for (const [column, statement] of FINDING_COLUMNS) {
    if (!hasColumn(db, 'findings', column)) db.exec(statement)
  }

  // Confianza: bases anteriores no la tienen. Default 0 = no confiable, que es
  // el lado seguro (el agente no auto-ejecuta scripts hasta que se marque).
  if (!hasColumn(db, 'projects', 'trusted')) {
    db.exec('ALTER TABLE projects ADD COLUMN trusted INTEGER NOT NULL DEFAULT 0')
  }

  // Loop autonomo: bases anteriores no lo tienen. Default 0 = apagado.
  if (!hasColumn(db, 'projects', 'loop_enabled')) {
    db.exec('ALTER TABLE projects ADD COLUMN loop_enabled INTEGER NOT NULL DEFAULT 0')
  }

  // Fase aprobada de una capacidad: bases que crearon la tabla sin ella. Default
  // 'propuesta' = el lado seguro (nada asciende hasta que se apruebe el salto).
  if (!hasColumn(db, 'capabilities', 'phase')) {
    db.exec("ALTER TABLE capabilities ADD COLUMN phase TEXT NOT NULL DEFAULT 'propuesta'")
  }
}
