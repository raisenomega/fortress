import type { LoopStopReason } from './loop-decision'

/** Lo que el envoltorio sabe al parar. Los frenos disparan EN su tope, asi que
 *  el tope es la cifra real: no hace falta sacar los contadores del ciclo. */
export interface StopFacts {
  readonly spentSession: number
  readonly costCap: number
  readonly cyclesDone: number
  readonly maxCycles: number
  readonly maxConsecutiveDenials: number
  readonly maxConsecutiveNoCandidates: number
}

const dinero = (usd: number): string => `$${usd.toFixed(2)}`

/**
 * La cifra que acompana al motivo, derivada del estado real. Se compone en un
 * solo sitio a proposito: escribirla en cada rama de parada la dejaria
 * envejecer por su cuenta, que es como se acaba anunciando un tope que ya no
 * es el vigente.
 *
 * `detenido` y `error` no llevan cifra: uno lo explica el operador y el otro
 * trae el mensaje de la excepcion, que dice mas que cualquier contador.
 */
export function detalleDeParada(reason: LoopStopReason, hechos: StopFacts): string | null {
  switch (reason) {
    case 'tope-gasto':
      return `${dinero(hechos.spentSession)} de ${dinero(hechos.costCap)}`
    case 'tope-ciclos':
      return `${hechos.cyclesDone} de ${hechos.maxCycles} propuestas cerradas`
    case 'tope-denegaciones':
      return `${hechos.maxConsecutiveDenials} denegaciones seguidas de la politica`
    case 'pool-agotado':
      return `${hechos.maxConsecutiveNoCandidates} vueltas seguidas sin candidato`
    case 'resuelto':
      return 'tres escaneos 100/100 seguidos'
    default:
      return null
  }
}
