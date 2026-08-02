import type { TokenUsage } from '@domain/telemetry/token-usage'

/** Columnas de consumo, compartidas por la fila cruda y por los agregados. */
export interface UsageColumns {
  readonly input_tokens: number
  readonly output_tokens: number
  readonly cache_read_tokens: number
  readonly cache_creation_tokens: number
  readonly cost_usd: number
  readonly num_turns: number
}

export function usageFromRow(row: UsageColumns): TokenUsage {
  return {
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    cacheReadTokens: row.cache_read_tokens,
    cacheCreationTokens: row.cache_creation_tokens,
    costUsd: row.cost_usd,
    numTurns: row.num_turns
  }
}
