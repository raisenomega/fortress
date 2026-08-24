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
 * `generator_error` YA NO ESTA, y esto es el cumplimiento de lo que esta misma
 * nota prometia: cubria la transicion invalida, esa se llama ahora
 * `invalid_state`, y sin nadie que lo emita clasificar el valor seria clasificar
 * un fantasma. Sobrevive en el vocabulario para que las filas viejas se lean.
 */
const AVERIAS: readonly RejectionReason[] = ['provider_error', 'omega_error']

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
