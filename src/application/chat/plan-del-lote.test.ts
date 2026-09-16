import { describe, expect, it } from 'vitest'
import type { CodeAgent, CodeAgentRequest } from '@domain/chat/code-agent'
import type { HallazgoAResolver } from '@domain/chat/hallazgo-a-resolver'
import type { FindingMemory } from '@domain/project/finding-memory'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { AppContext } from '../context'
import { PROJECT } from './chat-test-fixtures'
import { lineasDelLote } from './hallazgos-del-lote'
import { listaDelTurno } from './lista-del-turno'
import { replyFromChat } from './reply-from-chat'
import type { SendMessageInput } from './send-message-types'

// prettier-ignore
const memoria = (id: string, over: Partial<FindingMemory> = {}): FindingMemory => ({ id, identity: 'i', severity: 'HIGH', title: `t-${id}`, file: 'a.ts', line: 3, simbolo: null, status: 'open', lifecycle: 'ACTIVE', ...over }) as FindingMemory

const context = {
  findings: {
    listMemory: () => [memoria('f1'), memoria('f2'), memoria('f3', { lifecycle: 'MITIGATED' })]
  }
} as unknown as AppContext

describe('los hallazgos del lote se releen de la base, como el foco', () => {
  it('una linea por hallazgo vivo; el mitigado no entra', () => {
    expect(lineasDelLote(context, 'p1', ['f1', 'f2', 'f3'])).toEqual([
      'HIGH a.ts:3 — t-f1',
      'HIGH a.ts:3 — t-f2'
    ])
  })

  it('con foco, la lista son sus HERMANOS: el del foco se queda fuera', () => {
    expect(lineasDelLote(context, 'p1', ['f1', 'f2'], 'f1')).toEqual(['HIGH a.ts:3 — t-f2'])
  })

  it('un id que no es de este proyecto no aporta linea', () => {
    expect(lineasDelLote(context, 'p1', ['ajeno'])).toEqual([])
  })

  it('con foco y SIN lote, la lista va vacia: el historial no viaja con el foco', () => {
    const foco = { id: 'f1' } as HallazgoAResolver
    // prettier-ignore
    const envio: SendMessageInput = { projectId: 'p1', prompt: 'x', mode: 'autonomo', excludedAgents: [] }

    expect(listaDelTurno(context, PROJECT, envio, foco)).toEqual([])
  })

  it('con foco y lote, la lista son sus hermanos', () => {
    const foco = { id: 'f1' } as HallazgoAResolver
    // prettier-ignore
    const envio: SendMessageInput = { projectId: 'p1', prompt: 'x', mode: 'autonomo', excludedAgents: [], lote: ['f1', 'f2'] }

    expect(listaDelTurno(context, PROJECT, envio, foco)).toEqual(['HIGH a.ts:3 — t-f2'])
  })
})

describe('el turno de PLAN del lote lo contesta el productor, no el router', () => {
  it('con lote y sin foco: productor', async () => {
    const pedidos: CodeAgentRequest[] = []
    const cli: CodeAgent = {
      isAvailable: () => true,
      precheck: () => null,
      run: (pedido) => (pedidos.push(pedido), Promise.resolve({ text: 'ok', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] })) // prettier-ignore
    }
    const noop = (): void => {}
    // «limpia el codigo muerto» es la frase que el router mandaria al Refactor Cleaner.
    // prettier-ignore
    await replyFromChat({ codeAgent: cli, project: PROJECT, corpus: EMPTY_CORPUS, prompt: 'limpia el codigo muerto', mode: 'supervisado', excludedAgents: [], onStep: noop, onChunk: noop, known: ['HIGH a.ts:3 — t-f1'], isCancelled: () => false, deLote: true })

    expect(pedidos[0]?.agentId).toBe('productor')
    expect(pedidos[0]?.prompt).toContain('Los hallazgos del lote que el operador quiere resolver:')
    expect(pedidos[0]?.reanudarSesion).toBeUndefined()
  })
})
