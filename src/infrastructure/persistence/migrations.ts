import { addAgentRunColumns } from './add-agent-run-columns'
import { addFindingMemory } from './add-finding-memory'
import { addObservationStatus } from './add-observation-status'
import { addProjectColumns } from './add-project-columns'
import { addRepairProjectFk } from './add-repair-project-fk'
import { expandAgentRunsKind } from './expand-agent-runs-kind'
import { migrarElChat } from './migrar-el-chat'
import { migrarDatos } from './migraciones-de-datos'
import { SUELTAS } from './columnas-sueltas'
import { FINDING_COLUMNS } from './columnas-de-findings'
import { hasColumn } from './has-column'
import type { Db } from './database'

/**
 * Migraciones para bases que ya existen: el esquema base (CREATE IF NOT
 * EXISTS) no anade columnas a tablas viejas. Nombres literales, nunca input.
 */
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

  // La bandera de "esta factura no se pudo leer". Va ANTES del recambio desde
  // que `usage_known` vive en `AGENT_RUNS_COLUMNS`: asi toda base llega al
  // recambio con las mismas columnas que la tabla nueva. El orden era el
  // contrario mientras la copia iba por `SELECT *`, y aquello hacia el
  // recambio de un solo uso.
  addAgentRunColumns(db)

  // Los `kind` que fueron llegando: `repair` para el motor, `sistema` para los
  // agentes auxiliares. Recrea la tabla, asi que ningun ALTER debe ir despues.
  expandAgentRunsKind(db)

  // La familia del chat (B0 + indices + carpetas + el CHECK con 'cto'), en su
  // modulo y en su orden: `chats` ya existe porque el esquema base corre antes.
  migrarElChat(db)

  // El estado de tres valores del backlog de auto-mejora, con su backfill.
  addObservationStatus(db)

  // El otro recambio: las dos tablas que colgaban del proyecto sin clave
  // foranea. Va la ULTIMA de las que tocan ESQUEMA — recrea tablas, y ningun
  // ALTER de arriba debe encontrarselas a medio sustituir.
  addRepairProjectFk(db)

  // Y las que no tocan el esquema sino los DATOS, juntas y las ultimas.
  migrarDatos(db)
}
