import { describe, expect, it, vi } from 'vitest'
import type { CodeAgent, CodeAgentReply } from '@domain/chat/code-agent'
import type { IntentoFallido } from '@domain/scan/intento-fallido'
import { createClaudeScanner } from './claude-scanner'

vi.mock('../project/discover-corpus', () => ({ discoverCorpus: () => ({ docs: [], directories: [] }) })) // prettier-ignore

/** La factura de un intento que costo dinero de verdad. */
const FACTURA = {
  inputTokens: 112,
  outputTokens: 49_629,
  cacheReadTokens: 5_976_485,
  cacheCreationTokens: 204_460,
  costUsd: 15.32,
  numTurns: 65
}

function agenteQueResponde(reply: Partial<CodeAgentReply>): CodeAgent {
  return {
    isAvailable: () => true,
    precheck: () => null,
    run: () =>
      Promise.resolve({
        text: '',
        failed: false,
        denials: [],
        usage: FACTURA,
        tools: ['Read', 'Grep'],
        edits: [],
        ...reply
      })
  }
}

async function escanear(reply: Partial<CodeAgentReply>): Promise<IntentoFallido[]> {
  const avisos: IntentoFallido[] = []
  const scanner = createClaudeScanner(agenteQueResponde(reply), (i) => avisos.push(i))
  await scanner.scan({ projectPath: '/tmp/p', projectName: 'p', projectId: 'p1' }, () => undefined)
  return avisos
}

describe('el intento que MUERE deja su factura', () => {
  it('un proceso que revienta avisa con el gasto real', async () => {
    const [aviso] = await escanear({ failed: true, text: 'lo mato el reloj' })

    expect(aviso.motivo).toBe('proceso')
    expect(aviso.usage).toEqual(FACTURA)
    expect(aviso.usage.costUsd).toBe(15.32)
    expect(aviso.tools).toEqual(['Read', 'Grep'])
    expect(aviso.projectId).toBe('p1')
  })
})

describe('el intento que TERMINA BIEN y no se entiende — el caso Health Flow', () => {
  it('gasto, cerro limpio, y ahora deja constancia', async () => {
    // exit 0, factura legible, y el informe sin bloque JSON que parsear.
    const [aviso] = await escanear({ failed: false, text: 'un muro de analisis sin bloque' })

    expect(aviso.motivo).toBe('informe-ilegible')
    // La factura de este SIEMPRE fue legible: se tiraba por el camino, no por
    // falta. Es el gasto que la base daba por cero.
    expect(aviso.usage).toEqual(FACTURA)
    expect(aviso.texto).toBe('un muro de analisis sin bloque')
  })
})
