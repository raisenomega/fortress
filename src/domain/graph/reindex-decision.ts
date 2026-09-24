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
   * true solo en la reconciliacion del ARRANQUE: ahi un RUNNING no puede ser
   * una corrida viva (la cola es de memoria y el indexador un hijo del proceso),
   * asi que se reclama sin esperar. Fuera del arranque manda STALE_MS.
   */
  readonly onBoot?: boolean
  /**
   * Hay un turno VIVO en ese proyecto: puede tener un `checkpoint transitorio`
   * abierto que se DESHACE al cerrar (`reset --soft`). Indexar encima deja el
   * indice en un sha que dejara de existir. Paso el 2026-09-19 en raisen-nucleo.
   */
  readonly turnoVivo?: boolean
  /**
   * Si el `.db` del indice existe en disco. La contabilidad de FORTRESS (el sha
   * indexado) y la cache del grafo son dos sitios: la cache renacio el
   * 2026-08-29 y mailbd siguio «alineado con HEAD» un mes sin indice. Ausente
   * = llamador viejo: la matriz de antes.
   */
  readonly indiceEnDisco?: boolean
  readonly now: number
}

export interface ReindexDecision {
  readonly action: 'SKIP' | 'REINDEX' | 'RECLAIM_STALE'
  readonly reason: string
}

/**
 * Decide si el grafo necesita realinearse con el HEAD vivo. Pura. El gate
 * RUNNING va PRIMERO a proposito: sin el, un proyecto nunca-indexado con una
 * corrida fresca en curso re-dispararia en cada foco. En el ARRANQUE ese gate
 * se invierte (costo un chip girando 15 minutos sobre una corrida muerta): una
 * marca RUNNING vista al arrancar es huerfana SIEMPRE, sin edad que valga.
 */
export function decideReindex(input: ReindexInput): ReindexDecision {
  if (input.turnoVivo === true) {
    return { action: 'SKIP', reason: 'turno vivo: su checkpoint se deshara' }
  }
  if (input.status === 'RUNNING') {
    if (input.onBoot === true) {
      return { action: 'RECLAIM_STALE', reason: 'arranque: la corrida previa murio con su proceso' }
    }
    const age = input.now - (input.runningSince ?? input.now)
    if (age < STALE_MS) return { action: 'SKIP', reason: `corrida en curso (${Math.round(age / 1000)}s)` } // prettier-ignore
    return { action: 'RECLAIM_STALE', reason: 'corrida huerfana: se re-dispara' }
  }
  if (input.indexedSha === null) return { action: 'REINDEX', reason: 'nunca indexado' }
  if (input.indiceEnDisco === false) return { action: 'REINDEX', reason: 'indice ausente en disco' }
  if (input.currentSha === input.indexedSha) {
    if (input.status === 'IDLE') return { action: 'SKIP', reason: 'grafo alineado con HEAD' }
    return { action: 'SKIP', reason: 'HEAD sin cambios desde el ultimo intento fallido' }
  }
  return { action: 'REINDEX', reason: `HEAD ${input.currentSha.slice(0, 7)} != indexado ${input.indexedSha.slice(0, 7)}` } // prettier-ignore
}
