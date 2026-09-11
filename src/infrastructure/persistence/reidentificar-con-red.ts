import type { Db } from './database'
import { reidentificarHallazgos } from './reidentificar-hallazgos'

/**
 * El backfill de ADR-084 con su red: mejor esfuerzo CON constancia.
 *
 * Un fallo aqui no puede impedir abrir la app —el operador se quedaria sin
 * FORTRESS por un backfill— pero tampoco puede pasar en silencio: si no corrio,
 * la base sigue con claves viejas y el proximo escaneo DUPLICARA en vez de
 * limpiar, que es justo lo que este arco existe para impedir. La transaccion de
 * dentro garantiza todo-o-nada, asi que un fallo deja la base coherente y solo
 * sin migrar; volver a abrir la app lo reintenta.
 *
 * Se calla cuando no fusiono nada: en una base ya migrada eso es TODOS los
 * arranques, y una linea por arranque diciendo «0» entrena a no leer el log.
 */
export function reidentificarConRed(db: Db): void {
  try {
    const { reescritas, absorbidas } = reidentificarHallazgos(db)
    if (absorbidas > 0) {
      console.log(`[ADR-084] ${reescritas} claves recalculadas, ${absorbidas} filas fusionadas`)
    }
  } catch (error) {
    const aviso = 'el backfill de identidades NO corrio: la base sigue con claves viejas y el proximo escaneo duplicara' // prettier-ignore
    console.error(`[ADR-084] ${aviso}`, error)
  }
}
