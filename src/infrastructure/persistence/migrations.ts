import { addFindingMemory } from './add-finding-memory'
import { addProjectColumns } from './add-project-columns'
import { expandAgentRunsKind } from './expand-agent-runs-kind'
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

/**
 * Columnas sueltas que fueron llegando. Cada default es el lado SEGURO: sin
 * confianza no se auto-ejecuta nada, sin loop no arranca nada, y una capacidad
 * nace propuesta porque nada asciende hasta que se apruebe el salto.
 */
const SUELTAS: ReadonlyArray<readonly [string, string, string]> = [
  ['projects', 'trusted', 'ALTER TABLE projects ADD COLUMN trusted INTEGER NOT NULL DEFAULT 0'],
  ['projects', 'loop_enabled', 'ALTER TABLE projects ADD COLUMN loop_enabled INTEGER NOT NULL DEFAULT 0'], // prettier-ignore
  ['projects', 'general_quality', 'ALTER TABLE projects ADD COLUMN general_quality INTEGER'],
  ['projects', 'config_state', "ALTER TABLE projects ADD COLUMN config_state TEXT NOT NULL DEFAULT 'CONFIGURADO'"], // prettier-ignore
  ['capabilities', 'phase', "ALTER TABLE capabilities ADD COLUMN phase TEXT NOT NULL DEFAULT 'propuesta'"], // prettier-ignore
  // Nullable a proposito: una sesion anterior a esto no tiene motivo que contar,
  // y escribirle uno seria inventarselo.
  ['loop_sessions', 'stopped_reason', 'ALTER TABLE loop_sessions ADD COLUMN stopped_reason TEXT'], // prettier-ignore
  ['loop_sessions', 'stopped_reason_detail', 'ALTER TABLE loop_sessions ADD COLUMN stopped_reason_detail TEXT'], // prettier-ignore
  ['loop_sessions', 'stopped_at', 'ALTER TABLE loop_sessions ADD COLUMN stopped_at TEXT']
]

export function runMigrations(db: Db): void {
  if (!hasColumn(db, 'chat_messages', 'engine')) {
    db.exec("ALTER TABLE chat_messages ADD COLUMN engine TEXT NOT NULL DEFAULT 'api'")
  }

  for (const [column, statement] of FINDING_COLUMNS) {
    if (!hasColumn(db, 'findings', column)) db.exec(statement)
  }

  // Memoria del hallazgo (clave estable, ciclo de vida, fechas): va aparte
  // porque ademas de anadir columnas rellena la historia de las filas viejas.
  addFindingMemory(db)

  for (const [tabla, columna, statement] of SUELTAS) {
    if (!hasColumn(db, tabla, columna)) db.exec(statement)
  }

  // Stats del grafo + las 6 columnas del score integral (todas nullables).
  addProjectColumns(db)

  // El motor de reparacion necesita su propio `kind`. Va la ultima porque es la
  // unica que recrea una tabla: si algo falla, lo anterior ya quedo aplicado.
  expandAgentRunsKind(db)
}
