import { describe, expect, it } from 'vitest'
import type { CodeAgent, CodeAgentReply } from '@domain/chat/code-agent'
import type { StoredCapability } from '@domain/system/capability'
import type { CapabilityRepository } from '@domain/system/capability-repository'
import type { AgentDraftRepository } from '@domain/system/agent-draft-repository'
import type { CapabilityEpisode, NewCapabilityEpisode } from '@domain/system/capability-episode'
import type { CapabilityEpisodeRepository } from '@domain/system/capability-episode-repository'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { AppContext } from '../context'
import { runLearningEpisode } from './run-learning-episode'

function reply(over: Partial<CodeAgentReply>): CodeAgentReply {
  return { text: '', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [], ...over }
}

function fakeAgent(r: CodeAgentReply): CodeAgent {
  return { isAvailable: () => true, precheck: () => null, run: () => Promise.resolve(r) }
}

function context(): { ctx: AppContext; recorded: NewCapabilityEpisode[] } {
  const recorded: NewCapabilityEpisode[] = []
  const capabilities = {
    findById: () => ({ id: 'c1', name: 'R' }) as StoredCapability
  } as unknown as CapabilityRepository
  const agentDrafts = { get: () => null } as unknown as AgentDraftRepository
  const capabilityEpisodes: CapabilityEpisodeRepository = {
    record: (e) => {
      recorded.push(e)
      return { ...e, id: 'e1', createdAt: 'now' } as CapabilityEpisode
    },
    listFor: () => [],
    tallyFor: () => ({ episodes: 0, failures: 0 })
  }
  return {
    ctx: { capabilities, agentDrafts, capabilityEpisodes } as unknown as AppContext,
    recorded
  }
}

const BLOCK = 'EPISODE: {"outcome":"ok","summary":"resolvio un caso"}'

describe('runLearningEpisode', () => {
  it('registra el episodio que resolvio la capacidad', async () => {
    const { ctx, recorded } = context()
    const r = await runLearningEpisode(ctx, 'c1', fakeAgent(reply({ text: BLOCK })), '/tmp/x')
    expect(r.ok).toBe(true)
    expect(recorded[0]?.outcome).toBe('ok')
  })

  it('si el agente falla, no registra y da error', async () => {
    const { ctx, recorded } = context()
    const r = await runLearningEpisode(
      ctx,
      'c1',
      fakeAgent(reply({ failed: true, text: 'x' })),
      '/tmp/x'
    )
    expect(r.ok).toBe(false)
    expect(recorded).toHaveLength(0)
  })

  it('sin resultado claro, no registra', async () => {
    const { ctx, recorded } = context()
    const r = await runLearningEpisode(ctx, 'c1', fakeAgent(reply({ text: 'nada' })), '/tmp/x')
    expect(r.ok).toBe(false)
    expect(recorded).toHaveLength(0)
  })
})
