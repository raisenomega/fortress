import { describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import type { CodeAgent, CodeAgentRequest } from '@domain/chat/code-agent'
import type { CodeAgentReply } from '@domain/chat/code-agent-reply'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { ok } from '@domain/shared/result'

/** PASO 80: los trozos del planner LLEGABAN al runner y se tiraban con un
 *  `() => {}` — el plan caia de golpe tras ~100s de pantalla muda (PASO 79). */

const reply: CodeAgentReply = { text: 'listo', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] } // prettier-ignore

vi.mock('./build-target', () => ({
  resolveTarget: (): unknown => ok({ id: 'p1', name: 'P', path: '/tmp/p', trusted: true }),
  agentFor: (): CodeAgent => ({
    isAvailable: (): boolean => true,
    precheck: (): null => null,
    run: (_req: CodeAgentRequest, onChunk: (d: string) => void): Promise<CodeAgentReply> => {
      onChunk('plan ')
      onChunk('parcial')
      return Promise.resolve(reply)
    }
  })
}))
vi.mock('./save-plan-doc', () => ({ savePlanDoc: (): null => null }))

const { runBuildPlan } = await import('./run-build-plan')
const { runInvestigate } = await import('./run-investigate')

describe('el construir reenvia los trozos del agente en vez de tirarlos', () => {
  it('el Plan entrega cada trozo al oyente, en orden', async () => {
    const trozos: string[] = []
    await runBuildPlan({} as AppContext, 'p1', 'arregla x', (d) => trozos.push(d))
    expect(trozos).toEqual(['plan ', 'parcial'])
  })

  it('la Investigacion tambien, por el mismo cable', async () => {
    const trozos: string[] = []
    await runInvestigate({} as AppContext, 'p1', 'mira y', (d) => trozos.push(d))
    expect(trozos).toEqual(['plan ', 'parcial'])
  })
})
