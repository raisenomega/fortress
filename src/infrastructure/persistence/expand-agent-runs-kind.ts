import type { Db } from './database'
import { AGENT_RUNS_COLUMNS, AGENT_RUNS_INDEXES } from './schema-agent-runs'

interface Conteo {
  readonly c: number
}

const filas = (db: Db, tabla: string): number =>
  (db.prepare(`SELECT COUNT(*) c FROM ${tabla}`).get() as Conteo).c

/** Se mira la DDL guardada, no un numero de version que habria que mantener aparte. */
function yaAdmiteRepair(db: Db): boolean {
  const sql = 'SELECT sql FROM sqlite_master WHERE type = ? AND name = ?'
  const fila = db.prepare(sql).get('table', 'agent_runs') as { sql?: string } | undefined
  return fila?.sql?.includes("'repair'") === true
}

/**
 * Amplia el CHECK de `agent_runs.kind` para que admita las corridas del motor.
 *
 * Es la PRIMERA migracion del proyecto que no es aditiva. SQLite no deja tocar
 * un CHECK, asi que hay que recrear la tabla, copiar, borrar y renombrar; las
 * demas migraciones son `ALTER TABLE ADD COLUMN` y no arriesgan ninguna fila.
 *
 * Tres cuidados que esa diferencia obliga:
 *
 * - `foreign_keys` se apaga durante el recambio. Con las claves activas, el DROP
 *   de la tabla vieja puede arrastrar filas por cascada. El PRAGMA se ignora
 *   dentro de una transaccion, asi que va fuera y se restaura en el `finally`.
 * - El recuento se compara DENTRO de la transaccion. Si no cuadra, la excepcion
 *   revierte el recambio entero y la tabla vieja se queda donde estaba.
 * - El `INSERT ... SELECT *` exige el mismo orden de columnas, y por eso la
 *   tabla nueva se construye desde la MISMA definicion que el esquema base.
 */
export function expandAgentRunsKind(db: Db): void {
  if (yaAdmiteRepair(db)) return

  db.pragma('foreign_keys = OFF')
  try {
    db.transaction(() => {
      const antes = filas(db, 'agent_runs')
      db.exec(`CREATE TABLE agent_runs_nueva (${AGENT_RUNS_COLUMNS})`)
      db.exec('INSERT INTO agent_runs_nueva SELECT * FROM agent_runs')

      const copiadas = filas(db, 'agent_runs_nueva')
      if (copiadas !== antes) {
        throw new Error(`agent_runs: se copiaron ${copiadas} de ${antes} filas`)
      }

      db.exec('DROP TABLE agent_runs')
      db.exec('ALTER TABLE agent_runs_nueva RENAME TO agent_runs')
      // Los indices murieron con la tabla vieja; la nueva nace sin ninguno.
      db.exec(AGENT_RUNS_INDEXES)
    })()
  } finally {
    db.pragma('foreign_keys = ON')
  }
}
