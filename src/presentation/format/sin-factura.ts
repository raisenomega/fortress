import type { SinFactura } from '@domain/telemetry/sin-factura'
import { formatDuration } from './time'

const plural = (n: number, una: string, varias: string): string => (n === 1 ? una : varias)

/**
 * El aviso del pie, o `null` si no hay nada que avisar.
 *
 * `null` y no una cadena vacia: cuando todo esta medido el pie no cambia, y
 * quien lo pinta no tiene que acordarse de comprobar la longitud. Es la misma
 * forma que `formatCost`, que devuelve null en vez de "$0.00".
 *
 * Corto a proposito: el pie se ve desde todas las pantallas y compite con el
 * total. Dice cuantas y cuanto tiempo; el porque cabe en el title.
 */
export function fraseSinMedir(sin: SinFactura): string | null {
  if (sin.runs <= 0) return null
  return `${sin.runs} sin medir (${formatDuration(sin.durationMs)})`
}

/**
 * La version larga, para Rendimiento, donde hay sitio para decirlo entero.
 *
 * Nombra el coste como DESCONOCIDO en vez de callarlo: el operador esta mirando
 * una tarjeta de gasto, y lo que necesita saber es que ese numero no cuenta
 * estas corridas — no que se le ofrezca una cifra inventada para ellas.
 */
export function detalleSinMedir(sin: SinFactura): string | null {
  if (sin.runs <= 0) return null
  const corridas = plural(sin.runs, 'corrida', 'corridas')
  const ocurrieron = plural(sin.runs, 'ocurrio', 'ocurrieron')
  return `${sin.runs} ${corridas} sin factura: ${ocurrieron} y gastaron ${formatDuration(sin.durationMs)}, con coste desconocido. No entran en las cifras de arriba.` // prettier-ignore
}
