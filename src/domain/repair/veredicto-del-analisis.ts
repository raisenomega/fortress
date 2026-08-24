import { isActionable, type Analysis } from './analysis'
import { ILEGIBLE, noSeDejoLeer } from './analysis-ilegible'
import { NO_ARRANCO, noArranco } from './cli-no-arranco'
import type { AnalysisVerdict, ProposalState } from './proposal'

export interface Veredicto {
  readonly verdict: AnalysisVerdict
  readonly state: ProposalState
  /** Lo que se persiste y lo que el Libro asienta como razon. */
  readonly reason: string
}

/**
 * En que queda la propuesta segun lo que dijo el analista. TRES desenlaces, no
 * dos, y el tercero es el que faltaba.
 *
 * Un analisis que no se deja leer no es accionable, asi que caia por el lado de
 * OBSOLETO y la propuesta CADUCABA: el Libro escribia "el hallazgo ya no
 * existe" cuando la verdad era "no se pudo leer el veredicto", y el descuento
 * por base_sha se llevaba el hallazgo de la cola sin que nadie lo hubiera
 * resuelto. Se pillo en vivo tres veces en un dia, con JSON truncado.
 *
 * Por eso lo ilegible se mira PRIMERO: no es una tercera opinion del analista,
 * es la ausencia de opinion legible, y preguntarle a `isActionable` que opina
 * de un texto que no se pudo parsear solo puede dar una respuesta inventada.
 *
 * RECHAZADO y no CADUCADO porque es literalmente lo que el dominio entiende por
 * rechazo —"no llego a GENERADO"— y porque caducar significa que el hallazgo se
 * fue; aqui sigue entero, esperando que alguien lea bien la respuesta.
 *
 * Aqui NO se arregla el parser. Que lea mejor es otra deuda; esto es que cuando
 * falle, lo diga.
 *
 * Lo que este veredicto NO decide es la suerte del HALLAZGO. OBSOLETO caduca la
 * propuesta y abre la puerta a extinguirlo, pero quien la cruza es
 * `extinguirSiObsoleto`, comprobando la evidencia del analisis contra el fichero
 * real: sin prueba, el hallazgo se mitiga y sigue en el tablero.
 */
export function veredictoDelAnalisis(analysis: Analysis): Veredicto {
  // Antes que nada: sin proceso no hay respuesta que juzgar, ni legible ni
  // ilegible. Es del entorno de la maquina, no del analista ni del hallazgo.
  if (noArranco(analysis)) {
    const causa = analysis.risk.slice(NO_ARRANCO.length)
    return { verdict: 'NO_ARRANCO', state: 'RECHAZADO', reason: `cli_no_arranco: ${causa}` }
  }
  if (noSeDejoLeer(analysis)) {
    const muestra = analysis.risk.slice(ILEGIBLE.length)
    return { verdict: 'ILEGIBLE', state: 'RECHAZADO', reason: `analisis_ilegible: ${muestra}` }
  }
  if (isActionable(analysis)) {
    return { verdict: 'REAL', state: 'ANALIZADO', reason: analysis.risk }
  }
  return { verdict: 'OBSOLETO', state: 'CADUCADO', reason: analysis.risk }
}
