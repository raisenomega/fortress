import type { FilaOtro } from '@domain/project/retipado-de-otros'
import type { Db } from './database'

/**
 * Las vivas en `otro` de un proyecto, y SOLO esas (ADR-100 §5). Por el tipo y
 * por el ciclo de vida, nunca por la identidad: tras la sub-pieza 1 ya no queda
 * ninguna clave vieja viva, y las que tienen clase no entran aqui — el
 * re-tipado no toca lo que ya esta clasificado.
 */
const OTROS = `SELECT id, file, line, title, severity, identity, simbolo, first_seen AS firstSeen
  FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT' AND tipo = 'otro'
  ORDER BY file, line, first_seen`

export function leerOtros(db: Db, proyecto: string): readonly FilaOtro[] {
  return db.prepare(OTROS).all(proyecto) as FilaOtro[]
}
