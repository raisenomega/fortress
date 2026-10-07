import { describe, expect, it } from 'vitest'
import type { Project } from '@domain/project/project'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { AppContext } from '../context'
import { textOnly, type ReplyOutcome } from '../chat/reply-outcome'
import { recordChatRun } from './record-chat-run'

/** PASO 77, la ultima puerta: el asiento del chat escribia la fila SIN modelo
 *  por sus dos ramas (74 filas NULL). Asienta el que corrio, no el pedido. */

function contexto(filas: Record<string, unknown>[]): AppContext {
  return {
    transaction: (fn: () => void) => fn(),
    runs: { record: (r: Record<string, unknown>) => (filas.push(r), { id: 'r1' }) },
    activity: { recordMany: () => {} }
  } as unknown as AppContext
}

const asiento = (outcome: ReplyOutcome): Record<string, unknown>[] => {
  const filas: Record<string, unknown>[] = []
  recordChatRun(contexto(filas), {
    project: { id: 'p1' } as Project,
    agentId: null,
    engine: 'claude-code',
    outcome,
    startedAt: 1,
    prompt: 'hola'
  })
  return filas
}

const run = (modelo?: string): ReplyOutcome['runs'][number] =>
  ({ agentId: 'code-reviewer', usage: EMPTY_USAGE, failed: false, durationMs: 1, tools: [], ...(modelo === undefined ? {} : { modelo }) }) as ReplyOutcome['runs'][number] // prettier-ignore

describe('record-chat-run asienta el modelo en sus dos ramas', () => {
  it('fila por agente: cada run lleva EL SUYO, y el que no reporto queda sin el', () => {
    const outcome = { ...textOnly('x'), runs: [run('claude-opus-5-5'), run()] }
    const filas = asiento(outcome)
    expect(filas[0].modelo).toBe('claude-opus-5-5')
    expect('modelo' in filas[1]).toBe(false)
  })

  it('rama agregada (sin runs): asienta el modelo del outcome — hoy, el de la API', () => {
    const filas = asiento(textOnly('x', EMPTY_USAGE, 'claude-haiku-4-5'))
    expect(filas).toHaveLength(1)
    expect(filas[0].modelo).toBe('claude-haiku-4-5')
  })

  it('rama agregada sin modelo: NULL honesto, nada corrio que afirmar', () => {
    const filas = asiento(textOnly('x'))
    expect(filas).toHaveLength(1)
    expect('modelo' in filas[0]).toBe(false)
  })
})
