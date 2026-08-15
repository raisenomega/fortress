import { describe, expect, it } from 'vitest'
import { processOmegaOut } from './omega-out'

const salida = (usage: Record<string, number>): string =>
  JSON.stringify({ result: 'texto del revisor', usage, total_cost_usd: 0.42 })

describe('processOmegaOut: la factura cuenta los CUATRO contadores', () => {
  it('suma tambien cache_creation, que antes se quedaba fuera', () => {
    // Sumaba input + output + cache_read y se dejaba el cuarto. El tope por
    // propuesta se alimenta de este numero, asi que medía de menos.
    const out = processOmegaOut(
      salida({
        input_tokens: 1000,
        output_tokens: 2000,
        cache_read_input_tokens: 4000,
        cache_creation_input_tokens: 8000
      })
    )

    expect(out.tokens).toBe(15_000)
    expect(out.text).toBe('texto del revisor')
  })

  it('sin JSON valido no se inventa factura', () => {
    expect(processOmegaOut('esto no es json')).toEqual({ tokens: 0, text: 'esto no es json' })
  })

  it('sin bloque usage la factura es cero, no undefined', () => {
    expect(processOmegaOut(JSON.stringify({ result: 'ok' })).tokens).toBe(0)
  })
})
