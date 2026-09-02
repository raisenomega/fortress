import type { Db } from './database'
import { recambiarTabla } from './recambio-tabla'
import { QUALITY_SCANS_COLUMNS, QUALITY_SCANS_INDEXES } from './schema-quality'
import { REPAIR_PROPOSALS_COLUMNS, REPAIR_PROPOSALS_INDEXES } from './schema-repair'

/** Las dos tablas que colgaban del proyecto sin decirlo. Nombres literales. */
const TABLAS = [
  { nombre: 'repair_proposals', cols: REPAIR_PROPOSALS_COLUMNS, idx: REPAIR_PROPOSALS_INDEXES },
  { nombre: 'quality_scans', cols: QUALITY_SCANS_COLUMNS, idx: QUALITY_SCANS_INDEXES }
] as const

/** Se mira la DDL guardada, no un numero de version que habria que mantener aparte. */
function yaCuelga(db: Db, tabla: string): boolean {
  const sql = 'SELECT sql FROM sqlite_master WHERE type = ? AND name = ?'
  const fila = db.prepare(sql).get('table', tabla) as { sql?: string } | undefined
  return fila?.sql?.includes('REFERENCES projects(id)') === true
}

/**
 * Las filas que la clave foranea nueva NO admitiria: rastro de proyectos que se
 * borraron cuando nada las ataba. Se van antes del recambio porque copiarlas
 * dejaria la violacion dentro de la tabla nueva — reactivar el PRAGMA no
 * revalida lo ya escrito, asi que quedaria muda para siempre.
 *
 * El ORDEN es el contrario al intuitivo: con `foreign_keys` apagado la cascada
 * NO actua, asi que los eventos de una propuesta huerfana hay que borrarlos A
 * MANO y ANTES que ella. Al reves quedarian colgando de una propuesta que ya no
 * existe, cambiando una huerfana por cuatro.
 *
 * `omega_log` no se toca: no recibe clave foranea (ver `schema-omega`), y sus
 * asientos son el Libro que SOBREVIVE al proyecto por ley.
 */
function limpiarHuerfanos(db: Db): void {
  const sinProyecto = 'project_id NOT IN (SELECT id FROM projects)'
  db.exec(`DELETE FROM proposal_events WHERE proposal_id IN
    (SELECT id FROM repair_proposals WHERE ${sinProyecto})`)
  db.exec(`DELETE FROM repair_proposals WHERE ${sinProyecto}`)
  db.exec(`DELETE FROM quality_scans WHERE ${sinProyecto}`)
}

/**
 * Cuelga `repair_proposals` y `quality_scans` de su proyecto. Las dos guardaban
 * un `project_id` suelto, asi que borrar un proyecto las dejaba vivas y sin
 * dueno: una propuesta huerfana congela su hallazgo y no sale en ninguna vista.
 *
 * SQLite no admite anadir una clave foranea a una tabla existente, asi que hay
 * que recrearla. Es la segunda migracion no aditiva del proyecto y sigue el
 * procedimiento de la primera, `expand-agent-runs-kind`: `foreign_keys` se apaga
 * FUERA de la transaccion —el PRAGMA se ignora dentro— y se restaura en el
 * `finally`. Sin apagarlo, el DROP de `repair_proposals` arrastraria por cascada
 * los `proposal_events` de TODAS las propuestas, no solo de las huerfanas.
 */
export function addRepairProjectFk(db: Db): void {
  const faltan = TABLAS.filter((tabla) => !yaCuelga(db, tabla.nombre))
  if (faltan.length === 0) return

  db.pragma('foreign_keys = OFF')
  try {
    db.transaction(() => {
      limpiarHuerfanos(db)
      for (const { nombre, cols, idx } of faltan) recambiarTabla(db, nombre, cols, idx)
    })()
  } finally {
    db.pragma('foreign_keys = ON')
  }
}
