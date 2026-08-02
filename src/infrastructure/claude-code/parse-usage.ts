import { EMPTY_USAGE, type TokenUsage } from '@domain/telemetry/token-usage'

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/**
 * Consumo del evento `result`. La forma sale de la salida real del CLI 2.1.220,
 * comprobada ejecutandolo, no de la documentacion: los contadores viven en
 * `usage.*_tokens` y el coste en `total_cost_usd`, un nivel por encima.
 */
export function parseUsage(event: Record<string, unknown>): TokenUsage {
  const base = {
    ...EMPTY_USAGE,
    costUsd: count(event.total_cost_usd),
    numTurns: count(event.num_turns)
  }

  const usage = event.usage as Record<string, unknown> | undefined
  if (!usage) return base

  return {
    ...base,
    inputTokens: count(usage.input_tokens),
    outputTokens: count(usage.output_tokens),
    cacheReadTokens: count(usage.cache_read_input_tokens),
    cacheCreationTokens: count(usage.cache_creation_input_tokens)
  }
}
