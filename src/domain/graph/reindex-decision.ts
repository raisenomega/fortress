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
 */
export function decideReindex(input: ReindexInput): ReindexDecision {
  if (input.status === 'RUNNING') {
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
