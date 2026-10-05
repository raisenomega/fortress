import { describe, expect, it, vi } from 'vitest'

/**
 * El guardian del modelo en el chat del SDK (ADR-078, enmienda 2026-10-05): la
 * respuesta de la API trae `model` y se juzga como la del CLI. Con el SDK
 * doblado: el catalogo ofrece opus y la API contesta con lo que se le diga.
 */
const { respondeCon } = vi.hoisted(() => ({ respondeCon: { model: 'claude-opus-5-5' } }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    models = {
      list: async function* () {
        yield { id: 'claude-opus-5-5', created_at: '2026-08-01T00:00:00Z', display_name: 'Opus 5.5' }
      }
    }
    beta = {
      messages: {
        stream: () => ({
          on: () => undefined,
          finalMessage: () => Promise.resolve({ model: respondeCon.model, stop_reason: 'end_turn', content: [{ type: 'text', text: 'hola' }], usage: { input_tokens: 1, output_tokens: 1 } }) // prettier-ignore
        })
      }
    }
  }
}))

const { createAnthropicAssistant } = await import('./anthropic-assistant')
const pedir = (): Promise<unknown> => createAnthropicAssistant('k').stream({ system: 's', turns: [{ role: 'user', content: 'x' }] }, () => undefined) // prettier-ignore

describe('el chat del SDK juzga el modelo que contesto', () => {
  it('contesto en opus → entrega, con su modelo', async () => {
    respondeCon.model = 'claude-opus-5-5'
    expect(await pedir()).toMatchObject({ text: 'hola', modelo: 'claude-opus-5-5' })
  })

  it('contesto en Fable → NO entrega: falla con modelo no asignado', async () => {
    respondeCon.model = 'claude-fable-5'
    await expect(pedir()).rejects.toThrow(/modelo no asignado/)
  })

  it('contesto en sonnet, pedido opus → NO entrega', async () => {
    respondeCon.model = 'claude-sonnet-5-5'
    await expect(pedir()).rejects.toThrow(/modelo no asignado/)
  })
})
