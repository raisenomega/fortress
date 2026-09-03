import { addAgentRunColumns } from './add-agent-run-columns'
import { addFindingMemory } from './add-finding-memory'
import { addObservationStatus } from './add-observation-status'
import { addProjectColumns } from './add-project-columns'
import { addRepairProjectFk } from './add-repair-project-fk'
import { expandAgentRunsKind } from './expand-agent-runs-kind'
import { SUELTAS } from './columnas-sueltas'
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

  // Memoria del hallazgo (clave estable, ciclo de vida, fechas): va aparte
  // porque ademas de anadir columnas rellena la historia de las filas viejas.
  addFindingMemory(db)

  for (const [tabla, columna, statement] of SUELTAS) {
    if (!hasColumn(db, tabla, columna)) db.exec(statement)
  }

  // Stats del grafo + las 6 columnas del score integral (todas nullables).
  addProjectColumns(db)

  // El motor de reparacion necesita su propio `kind`. Va antes que el ALTER de
  // abajo porque recrea la tabla `agent_runs`, y su `INSERT ... SELECT *`
  // exige que las dos tengan las MISMAS columnas: una de mas y no abre.
  expandAgentRunsKind(db)

  // La bandera de "esta factura no se pudo leer". Aditiva y despues del
  // recambio, por lo anterior.
  addAgentRunColumns(db)

  // El estado de tres valores del backlog de auto-mejora, con su backfill.
  addObservationStatus(db)

  // El otro recambio: las dos tablas que colgaban del proyecto sin clave
  // foranea. Va la ULTIMA — recrea tablas, y ningun ALTER de arriba debe
  // encontrarselas a medio sustituir.
  addRepairProjectFk(db)
}
