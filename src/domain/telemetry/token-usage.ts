/**
 * Consumo de una ejecucion. Los cuatro contadores vienen separados porque el
 * cache cuesta distinto que el input normal, y sumarlos en un solo numero
 * escondería justo el dato que explica por que una sesion sale barata.
 */
export interface TokenUsage {
  readonly inputTokens: number
  readonly outputTokens: number
  readonly cacheReadTokens: number
  readonly cacheCreationTokens: number
  /**
   * Coste en dolares tal y como lo reporta el CLI. NO se calcula aqui: una
   * tabla de precios propia se quedaria vieja y mentiria sobre el gasto real.
   */
  readonly costUsd: number
  readonly numTurns: number
}

export const EMPTY_USAGE: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheCreationTokens: 0,
  costUsd: 0,
  numTurns: 0
}

/** Lo que se le ensena al operador: todo lo que entro mas todo lo que salio. */
export function totalTokens(usage: TokenUsage): number {
  return usage.inputTokens + usage.outputTokens + usage.cacheReadTokens + usage.cacheCreationTokens
}

export function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
    cacheCreationTokens: a.cacheCreationTokens + b.cacheCreationTokens,
    costUsd: a.costUsd + b.costUsd,
    numTurns: a.numTurns + b.numTurns
  }
}
