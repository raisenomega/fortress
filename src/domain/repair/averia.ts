import type { RejectionReason } from './repair-rejection'

/**
 * Que rechazos son una AVERIA: un fallo que no juzga al fix y que se arregla
 * ESPERANDO. Solo esos paran la tanda entera; el resto son desenlaces de una
 * propuesta y la siguiente sigue.
 *
 * La distincion no es cosmetica. Quien envuelve al motor reintenta ante una
 * averia y sigue adelante ante un veredicto, asi que meter aqui lo que no toca
 * tiene un precio medible: dos de los tres drenajes del 23-ago murieron con el
 * pozo aun lleno porque el reloj de UNA propuesta se anuncio como caida del
 * proveedor.
 *
 * Por eso NO estan los timeouts, ninguno de los tres. Un reloj que se agota es
 * un limite NUESTRO: esperar no lo arregla, y la propuesta siguiente puede
 * terminar en tres minutos. El gate ya lo trataba asi; ahora tambien el
 * generador y el revisor.
 *
 * `generator_error` sigue aqui mientras cubra la transicion invalida, que es un
 * bug nuestro: si el estado esta roto, la vuelta siguiente lo romperia igual y
 * cada vuelta cuesta un analista. Cuando ese caso tenga nombre propio, esta
 * entrada queda solo para las filas viejas y sale.
 */
const AVERIAS: readonly RejectionReason[] = ['provider_error', 'omega_error', 'generator_error']

export function esAveria(motivo: string): boolean {
  return (AVERIAS as readonly string[]).includes(motivo)
}

/**
 * Los relojes de los tres jueces. Se cuentan aparte de las demas bajas porque
 * una propuesta perdida por tiempo no dice nada del fix, y anunciarla como "gate
 * o correa" —donde caia— manda a leer un diff que nunca llego a juzgarse.
 */
const TIMEOUTS: readonly RejectionReason[] = ['generator_timeout', 'gate_timeout', 'omega_timeout']

export function esTimeout(motivo: string): boolean {
  return (TIMEOUTS as readonly string[]).some((t) => motivo === t || motivo.startsWith(`${t}:`))
}
