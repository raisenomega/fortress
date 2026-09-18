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
 * YA vive en `AGENT_RUNS_COLUMNS` (2026-09-11). Estuvo fuera mientras el
 * recambio copiaba con `INSERT ... SELECT *`, que exige el mismo numero y orden
 * de columnas; con ella dentro, una base vieja habria intentado meter quince
 * valores en dieciseis y no habria abierto. El precio de aquella salida era que
 * el recambio solo servia UNA vez. Ahora copia por nombre, la constante vuelve
 * a describir la tabla entera, y este ALTER va ANTES del recambio para que toda
 * base llegue a el con las mismas columnas.
 *
 * Sigue haciendo falta: una base anterior a la bandera no la tiene, y el
 * recambio no la anadiria —copia lo comun, no inventa columnas—.
 *
 * `recibo` (ADR-093 §3.3) es la segunda, y por las MISMAS razones: nullable
 * porque `NULL` es «de esta corrida no se capturo» —distinto de «no corrio
 * nada»—, sin relleno hacia atras porque inventarlo seria mentir, y aqui ademas
 * de en `AGENT_RUNS_COLUMNS` para que toda base llegue igual al recambio.
 */
const COLUMNS = ['usage_known INTEGER', 'recibo TEXT']

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
