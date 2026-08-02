import { describe, expect, it } from 'vitest'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { parseUsage } from './parse-usage'

/**
 * Payload copiado de una ejecucion real de `claude -p --output-format
 * stream-json --verbose` (CLI 2.1.220). Si el CLI cambia la forma, este test
 * es lo que se entera.
 */
const REAL_RESULT = {
  type: 'result',
  subtype: 'success',
  num_turns: 1,
  total_cost_usd: 0.0664025,
  usage: {
    input_tokens: 2,
    output_tokens: 4,
    cache_creation_input_tokens: 5807,
    cache_read_input_tokens: 15273,
    service_tier: 'standard'
  }
}

describe('parseUsage', () => {
  it('lee los cuatro contadores de la salida real del CLI', () => {
    expect(parseUsage(REAL_RESULT)).toEqual({
      inputTokens: 2,
      outputTokens: 4,
      cacheCreationTokens: 5807,
      cacheReadTokens: 15273,
      costUsd: 0.0664025,
      numTurns: 1
    })
  })

  it('toma el coste del CLI y no lo calcula', () => {
    // Un precio por token propio se quedaria viejo en cuanto cambie la tarifa.
    expect(parseUsage(REAL_RESULT).costUsd).toBe(0.0664025)
  })

  it('devuelve ceros si el evento no trae usage', () => {
    expect(parseUsage({ type: 'result' })).toEqual(EMPTY_USAGE)
  })

  it('conserva el coste aunque falte el bloque usage', () => {
    expect(parseUsage({ total_cost_usd: 0.5, num_turns: 3 })).toEqual({
      ...EMPTY_USAGE,
      costUsd: 0.5,
      numTurns: 3
    })
  })

  it('ignora contadores que no son numeros finitos', () => {
    const roto = { usage: { input_tokens: 'muchos', output_tokens: Number.NaN } }
    expect(parseUsage(roto)).toEqual(EMPTY_USAGE)
  })
})
