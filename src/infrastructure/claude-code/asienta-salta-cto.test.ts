import { describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import type { CodeAgent, CodeAgentRequest } from '@domain/chat/code-agent'
import type { CodeAgentReply } from '@domain/chat/code-agent-reply'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { CTO_OWNER } from '@domain/build/cto-owner'
import { agenteQueAsientaCorrida } from './agente-que-asienta'

/**
 * SELLO 1b (PASO 149b): el carril del CTO (CTO_OWNER) NO es un proyecto real;
 * `agent_runs.project_id` es NOT NULL + FK a projects, asi que la telemetria lo
 * debe SALTAR igual que al undefined, o cada turno CTO real intentaria un INSERT
 * condenado por la FK (foreign_keys=ON). Guardian: el decorador no asienta ese
 * carril, pero SI asienta un proyecto real.
 */
const reply: CodeAgentReply = {
  text: 'ok',
  failed: false,
  denials: [],
  usage: EMPTY_USAGE,
  tools: [],
  edits: []
}
const baseAgent: CodeAgent = {
  isAvailable: () => true,
  precheck: () => null,
  run: async () => reply
}

function ctxConSpy(): { ctx: AppContext; record: ReturnType<typeof vi.fn> } {
  const record = vi.fn()
  return { ctx: { runs: { record } } as unknown as AppContext, record }
}

const pedir = (projectId: string): CodeAgentRequest => ({
  projectPath: '/tmp/x',
  projectId,
  prompt: 'hola',
  permissionMode: 'libre',
  agentId: null,
  trusted: false
})

describe('la telemetria salta el carril sin proyecto real (Sello 1b)', () => {
  it('un turno con CTO_OWNER NO intenta asentar la corrida', async () => {
    const { ctx, record } = ctxConSpy()
    await agenteQueAsientaCorrida(baseAgent, ctx, 'sistema').run(pedir(CTO_OWNER), () => {})
    expect(record).not.toHaveBeenCalled()
  })

  it('un turno con projectId REAL si asienta la corrida', async () => {
    const { ctx, record } = ctxConSpy()
    await agenteQueAsientaCorrida(baseAgent, ctx, 'sistema').run(pedir('proyecto-real-7'), () => {})
    expect(record).toHaveBeenCalledTimes(1)
    expect(record).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'proyecto-real-7' }))
  })
})
