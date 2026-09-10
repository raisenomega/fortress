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

const BLOQUE = '```json\n{"findings":[]}\n```'

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

describe('el camino bueno no avisa: sigue asentando en el cierre', () => {
  it('un informe legible no dispara ningun intento fallido', async () => {
    expect(await escanear({ failed: false, text: BLOQUE })).toEqual([])
  })

  it('y devuelve el texto crudo para que quede en disco', async () => {
    const scanner = createClaudeScanner(agenteQueResponde({ text: BLOQUE }))
    const salida = await scanner.scan(
      { projectPath: '/tmp/p', projectName: 'p', projectId: 'p1' },
      () => undefined
    )

    expect(salida.ok && salida.value.texto).toBe(BLOQUE)
  })
})
