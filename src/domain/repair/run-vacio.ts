import type { Analysis } from './analysis'
import type { Candidate } from './select-target'

/**
 * La marca de "el modelo NO corrio" sobre un Analysis.
 *
 * Hermana de `cli-no-arranco` y `falla-del-proveedor`, y por el mismo motivo: la
 * ESCRIBE la infraestructura y la LEE el dominio al dictar veredicto. Distinta de
 * las tres vecinas: el proceso SI arranco (no es `noArranco`), el proveedor no se
 * quejo (no es PROVEEDOR) y no corrio un modelo malo (no es MODELO) — es que no
 * corrio NINGUN modelo: salida vacia, sin factura. Confundirla con ILEGIBLE era
 * mentir en el parte: "no se dejo leer" supone que hubo una respuesta que leer.
 */
export const RUN_VACIO = 'el modelo no corrio: '

/** Si el Analysis viene de una corrida en la que el modelo no llego a producir. */
export function runVacio(a: Analysis): boolean {
  return a.risk.startsWith(RUN_VACIO)
}

/** El Analysis de una corrida vacia: sin prosa, con su marca y nada mas — como
 *  `sinProceso`, porque tampoco aqui escribio nadie las cinco partes. */
// prettier-ignore
export function sinSalida(target: Candidate): Analysis {
  return {
    target, status: 'DESCONOCIDO', whatToChange: '', where: '', patternToCopy: '',
    doNotTouch: '', risk: RUN_VACIO, tokensUsed: 0
  }
}
