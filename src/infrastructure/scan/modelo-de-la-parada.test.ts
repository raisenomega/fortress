import { describe, expect, it, vi } from 'vitest'
import type { CodeAgent, CodeAgentReply } from '@domain/chat/code-agent'
import type { IntentoFallido } from '@domain/scan/intento-fallido'
import { findAgent } from '@domain/agent/agent-catalog'
import { createClaudeScanner } from './claude-scanner'

vi.mock('../project/discover-corpus', () => ({ discoverCorpus: () => ({ docs: [], directories: [] }) })) // prettier-ignore

/** Un informe legible y limpio: lo minimo que convierte la pasada en ok. */
const INFORME = 'Analisis.\n\n```json\n{"findings":[]}\n```'

// prettier-ignore
const FACTURA = { inputTokens: 1, outputTokens: 2, cacheReadTokens: 0, cacheCreationTokens: 0, costUsd: 0.1, numTurns: 3 }

function agenteQueResponde(reply: Partial<CodeAgentReply>): CodeAgent {
  return {
    isAvailable: () => true,
    precheck: () => null,
    run: () =>
      Promise.resolve({ text: INFORME, failed: false, denials: [], usage: FACTURA, tools: [], edits: [], ...reply }) // prettier-ignore
  }
}

async function pasada(
  reply: Partial<CodeAgentReply>
): Promise<{ modelo?: string; avisos: IntentoFallido[] }> {
  const avisos: IntentoFallido[] = []
  const scanner = createClaudeScanner(agenteQueResponde(reply), (i) => avisos.push(i))
  const r = await scanner.scan({ projectPath: '/tmp/p', projectName: 'p', projectId: 'p1' }, () => undefined) // prettier-ignore
  return { modelo: r.ok ? r.value.modelo : undefined, avisos }
}

describe('la parada que TERMINA guarda el modelo que corrio', () => {
  it('copia reply.modelo al outcome', async () => {
    const { modelo } = await pasada({ modelo: 'claude-opus-5-5' })
    expect(modelo).toBe('claude-opus-5-5')
  })

  it('CRITICO: persiste el que CORRIO, no el pedido del catalogo', async () => {
    // El escaner siempre pide con el agente del catalogo (opus declarado); el
    // stream dice que corrio un fallback mas viejo. La fila tiene que decir el
    // fallback: la noche del 05-oct probo que declarado y corrido divergen.
    expect(findAgent('security-reviewer')?.model).toBe('opus')

    const { modelo } = await pasada({ modelo: 'claude-opus-4-8' })
    expect(modelo).toBe('claude-opus-4-8')
    expect(modelo).not.toBe('opus')
  })

  it('candado: sin modelo en la respuesta, el outcome va sin el (honesto)', async () => {
    const { modelo } = await pasada({})
    expect(modelo).toBeUndefined()
  })
})

describe('el intento que MUERE guarda el modelo que corrio', () => {
  it('proceso: el aviso lleva reply.modelo', async () => {
    const { avisos } = await pasada({ failed: true, text: 'lo mato el reloj', modelo: 'claude-opus-5-5' }) // prettier-ignore
    expect(avisos[0].modelo).toBe('claude-opus-5-5')
  })

  it('informe-ilegible: tambien, que ese gasto ya es legible', async () => {
    const { avisos } = await pasada({ text: 'un muro sin bloque', modelo: 'claude-opus-4-8' })
    expect(avisos[0].motivo).toBe('informe-ilegible')
    expect(avisos[0].modelo).toBe('claude-opus-4-8')
  })

  it('candado: un intento sin modelo avisa sin el', async () => {
    const { avisos } = await pasada({ failed: true, text: 'x' })
    expect(avisos[0].modelo).toBeUndefined()
  })
})
