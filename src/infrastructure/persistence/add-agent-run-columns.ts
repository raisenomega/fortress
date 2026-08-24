import type { Db } from './database'

/**
 * Columnas de `agent_runs` anadidas despues del esquema base.
 *
 * `usage_known` dice si la factura de la corrida se pudo LEER. Hace falta porque
 * los cuatro contadores son `NOT NULL DEFAULT 0` y un cero significaba tres
 * cosas a la vez: salio gratis, el motor no reporta coste, o el CLI murio antes
 * de enviar su factura. Con la bandera, ese cero por fin se puede interpretar.
 *
 * Nullable a proposito, y sin relleno hacia atras: `NULL` es "fila anterior a la
 * bandera". Clasificar las viejas seria inferir, y las que estan a cero son
 * justamente las que no se pueden clasificar sin adivinar.
 *
 * NO vive en `AGENT_RUNS_COLUMNS`. Esa constante la reusa `expandAgentRunsKind`
 * para recrear la tabla con un `INSERT ... SELECT *`, que exige el mismo numero
 * y orden de columnas en las dos; anadirla alli haria que una base vieja
 * intentara meter quince valores en dieciseis y fallara al abrir. Por eso este
 * ALTER va DESPUES de aquel recambio en `runMigrations`.
 */
const COLUMNS = ['usage_known INTEGER']

function has(db: Db, column: string): boolean {
  const rows = db.pragma('table_info(agent_runs)') as { name: string }[]
  return rows.some((row) => row.name === column)
}

/** ALTER aditivo idempotente: anade las que falten. Nombres literales, nunca input. */
export function addAgentRunColumns(db: Db): void {
  for (const col of COLUMNS) {
    if (!has(db, col.split(' ')[0])) db.exec(`ALTER TABLE agent_runs ADD COLUMN ${col}`)
  }
}
