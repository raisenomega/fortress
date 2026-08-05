import { describe, expect, it } from 'vitest'
import type { CodeAgent, CodeAgentReply } from '@domain/chat/code-agent'
import type { CapabilityKind, StoredCapability } from '@domain/system/capability'
import type { CapabilityRepository } from '@domain/system/capability-repository'
import type { AgentDraftRepository, StoredAgentDraft } from '@domain/system/agent-draft-repository'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { AppContext } from '../context'
import { draftAgentAuto } from './draft-agent-auto'

function reply(over: Partial<CodeAgentReply>): CodeAgentReply {
  return { text: '', failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [], ...over }
}

function fakeAgent(r: CodeAgentReply): CodeAgent {
  return { isAvailable: () => true, precheck: () => null, run: () => Promise.resolve(r) }
}

function context(kind: CapabilityKind = 'agente'): { ctx: AppContext; saved: StoredAgentDraft[] } {
  const saved: StoredAgentDraft[] = []
  const capabilities: CapabilityRepository = {
    add: () => ({}) as StoredCapability,
    listAll: () => [],
    findById: () => ({ id: 'c1', kind, name: 'R', originObservation: 'o' }) as StoredCapability,
    promote: () => {}
  }
  const agentDrafts: AgentDraftRepository = {
    set: (id, d) => {
      const stored = { capabilityId: id, ...d, active: false }
      saved.push(stored)
      return stored
    },
    get: () => null,
    listActive: () => [],
    setActive: () => {},
    countActive: () => 0
  }
  return { ctx: { capabilities, agentDrafts } as unknown as AppContext, saved }
}

const BLOCK = 'AGENT-DRAFT: {"name":"R","prompt":"analiza"}'

describe('draftAgentAuto', () => {
  it('guarda el borrador que redacto el agente', async () => {
    const { ctx, saved } = context()
    const r = await draftAgentAuto(ctx, 'c1', fakeAgent(reply({ text: BLOCK })), '/tmp/x')
    expect(r.ok).toBe(true)
    expect(saved[0]?.prompt).toBe('analiza')
  })

  it('si el agente falla, devuelve error', async () => {
    const r = await draftAgentAuto(context().ctx, 'c1', fakeAgent(reply({ failed: true, text: 'boom' })), '/tmp/x')
    expect(r.ok).toBe(false)
  })

  it('si no hay bloque parseable, devuelve error', async () => {
    const r = await draftAgentAuto(context().ctx, 'c1', fakeAgent(reply({ text: 'nada util' })), '/tmp/x')
    expect(r.ok).toBe(false)
  })
})
