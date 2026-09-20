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
  /**
   * Hay un turno VIVO en ese proyecto. Mientras lo haya puede haber un
   * `checkpoint transitorio` abierto, y ese commit se DESHACE al cerrar
   * (`reset --soft`). Indexar encima deja el indice apuntando a un sha que
   * dejara de existir — y entonces `currentSha !== indexedSha` para siempre,
   * porque lo indexado no es que se quedara atras: es que se borro.
   *
   * Paso de verdad el 2026-09-19: `raisen-nucleo` quedo indexado en `1752916`,
   * un commit «checkpoint transitorio», mientras HEAD seguia en el del operador.
   */
  readonly turnoVivo?: boolean
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
  // PRIMERO de todo: con un turno vivo, lo que se indexaria puede ser efimero.
  // Esperar no cuesta nada —el cierre del lote vuelve a preguntar— y adelantarse
  // cuesta un indice roto que ningun SKIP posterior sabe reparar.
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
  if (input.currentSha === input.indexedSha) {
    if (input.status === 'IDLE') return { action: 'SKIP', reason: 'grafo alineado con HEAD' }
    return { action: 'SKIP', reason: 'HEAD sin cambios desde el ultimo intento fallido' }
  }
  return { action: 'REINDEX', reason: `HEAD ${input.currentSha.slice(0, 7)} != indexado ${input.indexedSha.slice(0, 7)}` } // prettier-ignore
}
