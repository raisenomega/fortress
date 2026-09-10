import type { Db } from './database'

/** Las columnas que ya existian antes de ADR-082: donde se compara. */
const COLUMNAS_DE_ANTES =
  'project_id, score, finding_count, dossier_count, critical_count, duration_ms'

/** Lecturas crudas del bench, para afirmar sobre FILAS y no sobre llamadas. */
export interface Consultas {
  /** La fila del escaneo, SOLO por sus columnas de antes. */
  filaDelEscaneo(): Record<string, unknown>
  hallazgosGuardados(): Record<string, unknown>[]
  cuantas(tabla: string): number
}

export function consultasDe(db: Db): Consultas {
  return {
    filaDelEscaneo: () =>
      db.prepare(`SELECT ${COLUMNAS_DE_ANTES} FROM scans`).get() as Record<string, unknown>,

    hallazgosGuardados: () =>
      db
        .prepare('SELECT severity, title, file, line, lifecycle FROM findings ORDER BY title')
        .all() as Record<string, unknown>[],

    cuantas: (tabla) => (db.prepare(`SELECT COUNT(*) AS n FROM ${tabla}`).get() as { n: number }).n
  }
}
