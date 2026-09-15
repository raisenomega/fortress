import { describe, expect, it } from 'vitest'
import type { CodeAgent, CodeAgentRequest } from '@domain/chat/code-agent'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import type { AgentId } from '@domain/agent/agent'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { PROJECT } from './chat-test-fixtures'
import { replyFromChat } from './reply-from-chat'
import { turno } from './turno-con-foco-fixture'

// El router la mandaria al Refactor Cleaner (Haiku): la frase perfecta para
// ver si el turno con foco la escucha o no.
const LIMPIA = 'limpia el codigo muerto'

async function contesta(
  enFoco?: string,
  excluidos: readonly AgentId[] = []
): Promise<string | null> {
  const pedidos: CodeAgentRequest[] = []
  const cli: CodeAgent = {
    isAvailable: () => true,
    precheck: () => null,
    run: (pedido) => (pedidos.push(pedido), Promise.resolve({ text: 'hecho', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] })) // prettier-ignore
  }
  const noop = (): void => {}
  // prettier-ignore
  await replyFromChat({ codeAgent: cli, project: PROJECT, corpus: EMPTY_CORPUS, prompt: LIMPIA, mode: 'autonomo', excludedAgents: excluidos, onStep: noop, onChunk: noop, known: [], isCancelled: () => false, enFoco })
  return pedidos[0]?.agentId ?? null
}

describe('con foco produce SIEMPRE el productor (ADR-088, Enmienda 2)', () => {
  it('con foco, la palabra no manda: el productor, no el Refactor Cleaner', async () => {
    expect(await contesta('## Hallazgo a resolver')).toBe('productor')
  })

  it('ni lo apaga el sidebar: dejarlo fuera no deja el turno sin quien produzca', async () => {
    expect(await contesta('## Hallazgo a resolver', ['productor'])).toBe('productor')
  })

  it('el chat LIBRE conserva el router: la misma frase va al Refactor Cleaner', async () => {
    expect(await contesta(undefined)).toBe('refactor-cleaner')
  })
})

describe('de punta a punta: el turno con foco del Terminal lo lanza el productor', () => {
  it('Resolver en Terminal llega al CLI con --agent productor', async () => {
    const { pedidos } = await turno({ prompt: 'Resuelve este hallazgo', findingId: 'f-neutro' })

    expect(pedidos.map((pedido) => pedido.agentId)).toEqual(['productor'])
  })
})
