/** Una corrida RUNNING mas vieja que esto se considera huerfana (proceso muerto). */
export const STALE_MS = 15 * 60 * 1000

export type GraphIndexingStatus = 'IDLE' | 'RUNNING' | 'ERROR'

export interface ReindexInput {
  /** HEAD vivo del repo del proyecto. */
  readonly currentSha: string
  /** SHA que quedo indexado la ultima vez, o null si nunca se indexo. */
  readonly indexedSha: string | null
  readonly status: GraphIndexingStatus
  readonly runningSince?: number
  /**
   * true solo cuando la reconciliacion es la del ARRANQUE del proceso. Ahi un
   * RUNNING no puede ser una corrida viva: la cola de indexado es de memoria y
   * el indexador es un hijo del proceso, asi que todo lo que corriera murio con
   * la instancia anterior. Fuera del arranque es al reves —un RUNNING reciente
   * es probablemente una corrida de ESTA instancia— y ahi manda STALE_MS.
   */
  readonly onBoot?: boolean
  readonly now: number
}

export interface ReindexDecision {
  readonly action: 'SKIP' | 'REINDEX' | 'RECLAIM_STALE'
  readonly reason: string
}

/**
 * Decide si el grafo necesita realinearse con el HEAD vivo. Pura: mismo input,
 * misma decision. El gate RUNNING va PRIMERO a proposito: sin el, un proyecto
 * nunca-indexado con una corrida fresca en curso re-dispararia en cada foco.
 *
 * En el ARRANQUE ese mismo gate se invierte, y esto costo un grafo colgado: una
 * instancia marco RUNNING, se cerro —su indexador hijo murio con ella— y la
 * siguiente vio la marca de hacia 25 segundos, la creyo viva y la respeto. El
 * chip giro sobre una corrida que ya no existia hasta cumplir los 15 minutos.
 * Una marca RUNNING vista al arrancar es huerfana SIEMPRE, sin excepcion y sin
 * edad que valga: nada de lo que la escribio sobrevivio al proceso.
 */
export function decideReindex(input: ReindexInput): ReindexDecision {
  if (input.status === 'RUNNING') {
    if (input.onBoot === true) {
      return { action: 'RECLAIM_STALE', reason: 'arranque: la corrida previa murio con su proceso' }
    }
    const age = input.now - (input.runningSince ?? input.now)
    if (age < STALE_MS) return { action: 'SKIP', reason: `corrida en curso (${Math.round(age / 1000)}s)` } // prettier-ignore
    return { action: 'RECLAIM_STALE', reason: 'corrida huerfana: se re-dispara' }
  }
  if (input.indexedSha === null) return { action: 'REINDEX', reason: 'nunca indexado' }
  if (input.currentSha === input.indexedSha) {
    if (input.status === 'IDLE') return { action: 'SKIP', reason: 'grafo alineado con HEAD' }
    return { action: 'SKIP', reason: 'HEAD sin cambios desde el ultimo intento fallido' }
  }
  return { action: 'REINDEX', reason: `HEAD ${input.currentSha.slice(0, 7)} != indexado ${input.indexedSha.slice(0, 7)}` } // prettier-ignore
}
