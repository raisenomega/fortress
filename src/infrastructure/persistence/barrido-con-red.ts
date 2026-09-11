import type { Db } from './database'
import { barrerObservaciones } from './barrido-del-cerco'

/**
 * El barrido de ADR-085 con su red, y corre al ABRIR la base — antes de que el
 * operador pueda exportar nada. Ese orden es el arco entero: si el barrido
 * corriera despues, existiria un instante en que `auto-mejora.json` todavia
 * lleva rutas del cliente.
 *
 * Mejor esfuerzo CON constancia, como el backfill de ADR-084: un fallo aqui no
 * puede impedir abrir la app, pero tampoco puede pasar en silencio — significa
 * que el backlog sigue con las citas dentro y el proximo export las llevaria.
 *
 * Se calla cuando no redacto nada: en una base ya barrida eso es TODOS los
 * arranques, y una linea por arranque diciendo «0» entrena a no leer el log.
 */
export function barrerConRed(db: Db): void {
  try {
    const tocadas = barrerObservaciones(db)
    if (tocadas > 0) console.log(`[ADR-085] ${tocadas} observaciones redactadas`)
  } catch (error) {
    const aviso = 'el barrido del cerco NO corrio: el backlog sigue con citas del cliente dentro y el proximo export las llevaria' // prettier-ignore
    console.error(`[ADR-085] ${aviso}`, error)
  }
}
