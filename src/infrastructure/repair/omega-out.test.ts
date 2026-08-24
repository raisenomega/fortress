import { describe, expect, it } from 'vitest'
import { EMPTY_USAGE, totalTokens } from '@domain/telemetry/token-usage'
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

    expect(totalTokens(out.usage ?? EMPTY_USAGE)).toBe(15_000)
    expect(out.usage?.costUsd).toBe(0.42)
    expect(out.text).toBe('texto del revisor')
  })

  it('sin JSON valido la factura queda AUSENTE, no en cero', () => {
    // Cero afirmaria que la corrida salio gratis; ausente dice que no se pudo
    // leer, que es lo unico cierto. La fila del libro lo marcara como tal.
    const crudo = processOmegaOut('esto no es json')
    expect(crudo.usage).toBeUndefined()
    expect(crudo.text).toBe('esto no es json')
  })

  it('con JSON pero sin bloque usage la factura SI es cero: el CLI la envio', () => {
    // Aqui la respuesta llego entera y no declaro consumo. Eso es una medida.
    expect(totalTokens(processOmegaOut(JSON.stringify({ result: 'ok' })).usage ?? EMPTY_USAGE)).toBe(0) // prettier-ignore
  })
})
