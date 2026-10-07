import { describe, expect, it } from 'vitest'
import type { AgentId } from '@domain/agent/agent'
import type { CodeAgent, CodeAgentReply } from '@domain/chat/code-agent'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import type { Project } from '@domain/project/project'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { replyFromWorkflow } from './reply-from-workflow'
import { textOnly } from './reply-outcome'
import { singleAgentOutcome } from './single-agent-outcome'

/** PASO 77: reply.modelo (el que DE VERDAD corrio, ADR-078) llegaba al reply y
 *  los tipos intermedios lo tiraban un salto antes del asiento: 74 filas NULL. */

const reply = (modelo?: string): CodeAgentReply =>
  ({ text: '', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [], ...(modelo === undefined ? {} : { modelo }) }) as CodeAgentReply // prettier-ignore

describe('el modelo del reply viaja hasta el asiento por los tres caminos', () => {
  it('CLI conversacional: singleAgentOutcome lo lleva a su run', () => {
    const salida = singleAgentOutcome('code-reviewer' as AgentId, reply('claude-opus-5-5'), '', 1)
    expect(salida.runs[0].modelo).toBe('claude-opus-5-5')
  })

  it('CLI sin modelo reportado: el run queda sin el (NULL honesto, no inventado)', () => {
    const salida = singleAgentOutcome('code-reviewer' as AgentId, reply(), '', 1)
    expect('modelo' in salida.runs[0]).toBe(false)
  })

  it('API: textOnly lo conserva en vez de descartarlo', () => {
    expect(textOnly('hola', EMPTY_USAGE, 'claude-haiku-4-5').modelo).toBe('claude-haiku-4-5')
    expect('modelo' in textOnly('hola')).toBe(false)
  })

  it('workflow: cada paso lo reporta y el consolidado lo lleva en CADA run', async () => {
    const cli: CodeAgent = {
      isAvailable: () => true,
      precheck: () => null,
      run: () => Promise.resolve(reply('claude-sonnet-5-5'))
    }
    const outcome = await replyFromWorkflow({
      codeAgent: cli,
      project: { id: 'p1', name: 'P', path: '/tmp/p', trusted: true } as Project,
      corpus: EMPTY_CORPUS,
      prompt: 'limpia el codigo muerto',
      mode: 'autonomo',
      excludedAgents: [],
      onStep: () => {},
      onChunk: () => {},
      known: [],
      isCancelled: () => false
    })
    expect(outcome.runs.length).toBeGreaterThan(0)
    for (const run of outcome.runs) expect(run.modelo).toBe('claude-sonnet-5-5')
  })
})
