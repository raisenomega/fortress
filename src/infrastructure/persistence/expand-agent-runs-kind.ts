import type { Db } from './database'
import { AGENT_RUNS_COLUMNS, AGENT_RUNS_INDEXES } from './schema-agent-runs'

interface Conteo {
  readonly c: number
}

const filas = (db: Db, tabla: string): number =>
  (db.prepare(`SELECT COUNT(*) c FROM ${tabla}`).get() as Conteo).c

/** Las columnas que la tabla tiene AHORA, en su orden. */
const columnas = (db: Db, tabla: string): string[] =>
  (db.pragma(`table_info(${tabla})`) as { name: string }[]).map((c) => c.name)

/** Se mira la DDL guardada, no un numero de version que habria que mantener aparte. */
function yaAdmiteSistema(db: Db): boolean {
  const sql = 'SELECT sql FROM sqlite_master WHERE type = ? AND name = ?'
  const fila = db.prepare(sql).get('table', 'agent_runs') as { sql?: string } | undefined
  return fila?.sql?.includes("'sistema'") === true
}

/**
 * Amplia el CHECK de `agent_runs.kind`. Lo hizo una vez para el motor
 * (`repair`) y otra para los agentes auxiliares (`sistema`).
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
 * - La copia va por NOMBRE de columna. La primera version usaba `SELECT *`, que
 *   exige el mismo numero y orden en las dos tablas; eso funciono mientras hubo
 *   un solo recambio, y convirtio al siguiente en un fallo al arrancar en
 *   cuanto un ALTER anadio una columna despues. Copiar por nombre lo hace
 *   repetible, que es lo que una migracion tiene que ser.
 */
export function expandAgentRunsKind(db: Db): void {
  if (yaAdmiteSistema(db)) return

  db.pragma('foreign_keys = OFF')
  try {
    db.transaction(() => {
      const antes = filas(db, 'agent_runs')
      db.exec(`CREATE TABLE agent_runs_nueva (${AGENT_RUNS_COLUMNS})`)
      // Por NOMBRE y no `SELECT *`. Aquel exigia el mismo numero y orden de
      // columnas en las dos, y eso hacia el recambio de UN SOLO USO: el ALTER
      // que anadio `usage_known` despues ya habria roto al siguiente. Copiando
      // las comunes, una base vieja sin esa columna entra igual —queda a NULL,
      // que es lo que esa bandera significa— y una de hoy la conserva.
      const comunes = columnas(db, 'agent_runs').filter((c) =>
        columnas(db, 'agent_runs_nueva').includes(c)
      )
      db.exec(`INSERT INTO agent_runs_nueva (${comunes}) SELECT ${comunes} FROM agent_runs`)

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
