import { redactarObservacion } from '@domain/system/cerco-de-observacion'
import type { Db } from './database'

interface Fila {
  readonly id: string
  readonly area: string
  readonly note: string
}

const TODAS = 'SELECT id, area, note FROM self_observations'
const REDACTAR = 'UPDATE self_observations SET area = @area, note = @note WHERE id = @id'

/**
 * El barrido de ADR-085: las observaciones que YA estaban escritas cuando el
 * cerco no existia.
 *
 * Hace falta porque el cerco del `add` solo protege lo FUTURO, y el inventario
 * del 2026-09-11 encontro OCHO observaciones con rutas de un proyecto ajeno ya
 * en la base — y ya exportables, porque `exportObservations` las escribe en
 * crudo en el fichero que sale de la maquina del cliente. Tapar lo nuevo y
 * dejar lo viejo filtrado seria incoherente.
 *
 * Sin `projectPath`: de una fila guardada no se sabe sobre que carpeta corrio el
 * agente —`source_project` es un nombre, no una ruta—. Las ocho fugas reales son
 * rutas RELATIVAS, que es justo lo que el cerco taja sin necesitar la raiz.
 *
 * Idempotente: la segunda pasada redacta lo ya redactado y no cambia nada, asi
 * que solo cuenta las que de verdad se movieron.
 */
export function barrerObservaciones(db: Db): number {
  const filas = db.prepare(TODAS).all() as Fila[]
  const redactar = db.prepare(REDACTAR)

  return db.transaction(() => {
    let tocadas = 0
    for (const f of filas) {
      const area = redactarObservacion(f.area)
      const note = redactarObservacion(f.note)
      if (area === f.area && note === f.note) continue
      redactar.run({ id: f.id, area, note })
      tocadas += 1
    }
    return tocadas
  })()
}
