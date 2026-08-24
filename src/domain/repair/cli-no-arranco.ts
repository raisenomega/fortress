import type { Analysis } from './analysis'
import type { Candidate } from './select-target'

/**
 * La marca de "el CLI no llego a arrancar" sobre un Analysis.
 *
 * Hermana de `analysis-ilegible` y por el mismo motivo: la ESCRIBE el parser de
 * infraestructura y la LEE el dominio al dictar veredicto, y entre los dos no
 * hay mas canal que el propio Analysis.
 *
 * Existe aparte porque son dos cosas distintas que se confundian en una. Que
 * una respuesta no se deje leer supone que hubo respuesta; aqui no hubo
 * proceso. El analista resolvia con una cadena vacia —indistinguible de un CLI
 * que corrio y no dijo nada— y el expediente acababa registrando un juicio
 * sobre la calidad de algo que nunca existio.
 */
export const NO_ARRANCO = 'el CLI no arranco: '

/** Si el Analysis viene de un proceso que jamas llego a existir. */
export function noArranco(a: Analysis): boolean {
  return a.risk.startsWith(NO_ARRANCO)
}

/**
 * El Analysis de una corrida que no existio: sin prosa, con su marca y nada
 * mas. No se rellenan las cinco partes con texto vacio por costumbre — que
 * esten vacias es el dato, porque nadie las escribio.
 */
// prettier-ignore
export function sinProceso(target: Candidate, error: string): Analysis {
  return {
    target, status: 'DESCONOCIDO', whatToChange: '', where: '', patternToCopy: '',
    doNotTouch: '', risk: `${NO_ARRANCO}${error}`, tokensUsed: 0
  }
}
