import type { ParadaDelLazo } from './lazo-del-motor'

/**
 * El motivo con el que la PARADA del lazo entra en el libro (DEUDAS §15.2).
 *
 * POR QUE EXISTE. Cuando el lazo decide NO dar la vuelta, `cerrarLaCadena`
 * ignoraba la parada: una parada legitima (convergio, tope) y un fallo
 * (sin-sesion: el motor no capturo la sesion) se veian IGUAL — nada. Es la
 * leccion de ADR-109 aplicada al propio lazo: lo que no se hizo se DECLARA
 * donde se lee, y el mecanismo sigue parando exactamente igual.
 */
export const MOTIVO_PARADA_DEL_LAZO = 'PARADA_DEL_LAZO'

/**
 * Que paradas dejan recibo: las CINCO del propio lazo, y solo esas.
 * `completo` no evaluo nada —el fix salio entero y gen=1 ya se lee— y
 * `paso-fallido` no es una parada del lazo: el generador, el gate o el revisor
 * cortaron y cada paso asienta el suyo (un segundo asiento mentiria el actor).
 */
export function dejaRecibo(parada: ParadaDelLazo | 'paso-fallido'): boolean {
  return parada !== 'completo' && parada !== 'paso-fallido'
}
