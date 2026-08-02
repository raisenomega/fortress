import { describe, expect, it } from 'vitest'
import { addUsage, EMPTY_USAGE, totalTokens, type TokenUsage } from './token-usage'

const usage = (overrides: Partial<TokenUsage> = {}): TokenUsage => ({
  ...EMPTY_USAGE,
  ...overrides
})

describe('totalTokens', () => {
  it('suma los cuatro contadores, no solo entrada y salida', () => {
    // El cache es la mayor parte del consumo real: dejarlo fuera daria una
    // cifra tranquilizadora y falsa.
    const consumo = usage({
      inputTokens: 2,
      outputTokens: 4,
      cacheReadTokens: 15_273,
      cacheCreationTokens: 5807
    })
    expect(totalTokens(consumo)).toBe(21_086)
  })

  it('es cero sin consumo', () => {
    expect(totalTokens(EMPTY_USAGE)).toBe(0)
  })
})

describe('addUsage', () => {
  it('acumula todos los campos, incluido el coste', () => {
    const a = usage({ inputTokens: 10, costUsd: 0.01, numTurns: 1 })
    const b = usage({ inputTokens: 5, outputTokens: 7, costUsd: 0.02, numTurns: 2 })

    expect(addUsage(a, b)).toEqual(
      usage({ inputTokens: 15, outputTokens: 7, costUsd: 0.03, numTurns: 3 })
    )
  })

  it('sumar lo vacio no cambia nada', () => {
    const uno = usage({ outputTokens: 42, costUsd: 1.5 })
    expect(addUsage(uno, EMPTY_USAGE)).toEqual(uno)
  })
})
