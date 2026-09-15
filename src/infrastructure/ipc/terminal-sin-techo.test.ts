import { describe, expect, it, vi } from 'vitest'
import { SIN_TECHO, TECHO_POR_DEFECTO } from '../claude-code/run-claude-process'

/** Cada llamada a `createClaudeCodeAgent`, con sus argumentos tal cual. */
const { llamadas } = vi.hoisted(() => ({ llamadas: [] as unknown[][] }))

vi.mock('../claude-code/claude-code-agent', () => ({
  createClaudeCodeAgent: (...args: unknown[]): unknown => {
    llamadas.push(args)
    return { agente: 'del-terminal' }
  }
}))
// El asistente de solo texto no lanza procesos: no tiene reloj que decidir.
vi.mock('../ai/assistant-factory', () => ({
  resolveAssistant: () => ({ ok: false, error: 'sin key' })
}))

const { buildChatEngines } = await import('./chat-engines')

/** Lo minimo que `buildChatEngines` lee del contexto. */
const contexto = {
  apiKeys: { has: (): boolean => false },
  settings: { get: (): null => null },
  connectors: { list: (): never[] => [] },
  agentDrafts: { listActive: (): never[] => [] }
}

/** El techo es el SEXTO argumento: el que el escaneo ya pasaba y el Terminal no. */
const TECHO = 5

describe('el Terminal arma su agente SIN techo (ADR-088, pieza 1)', () => {
  it('el sexto argumento paso de TECHO_POR_DEFECTO (por omision) a SIN_TECHO', () => {
    llamadas.length = 0

    const { codeAgent } = buildChatEngines(contexto as never)

    // Antes solo llegaban cinco argumentos y regia el default de 15 minutos.
    expect(llamadas[0]).toHaveLength(TECHO + 1)
    expect(llamadas[0][TECHO]).toBe(SIN_TECHO)
    expect(llamadas[0][TECHO]).not.toBe(TECHO_POR_DEFECTO)
    expect(codeAgent).toEqual({ agente: 'del-terminal' })
  })

  it('es UN solo agente: conversacion, workflow y entrevista comparten este', () => {
    llamadas.length = 0

    buildChatEngines(contexto as never)

    expect(llamadas).toHaveLength(1)
  })
})
