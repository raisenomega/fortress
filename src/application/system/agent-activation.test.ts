import { describe, expect, it } from 'vitest'
import type { CapabilityKind, StoredCapability } from '@domain/system/capability'
import type { CapabilityRepository } from '@domain/system/capability-repository'
import type { AgentDraftRepository, StoredAgentDraft } from '@domain/system/agent-draft-repository'
import type { AppContext } from '../context'
import { activateAgent, deactivateAgent } from './agent-activation'

interface Opts {
  readonly kind?: CapabilityKind
  readonly draft?: Partial<StoredAgentDraft> | null
  readonly activeCount?: number
}

function context(opts: Opts = {}): AppContext {
  const kind = opts.kind ?? 'agente'
  const draft =
    opts.draft === null
      ? null
      : { capabilityId: 'c1', name: 'R', prompt: 'analiza', iconName: 'sparkles', active: false, ...opts.draft }
  const capabilities: CapabilityRepository = {
    add: () => ({}) as StoredCapability,
    listAll: () => [],
    findById: (id) => (id === 'c1' ? ({ id, kind } as StoredCapability) : null),
    promote: () => {}
  }
  const agentDrafts: AgentDraftRepository = {
    set: () => draft as StoredAgentDraft,
    get: () => draft as StoredAgentDraft | null,
    listActive: () => [],
    setActive: () => {},
    countActive: () => opts.activeCount ?? 0
  }
  return { capabilities, agentDrafts } as unknown as AppContext
}

describe('activateAgent', () => {
  it('un agente exige firma humana', () => {
    expect(activateAgent(context(), 'c1', false).ok).toBe(false)
  })

  it('activa con humano y borrador limpio', () => {
    expect(activateAgent(context(), 'c1', true).ok).toBe(true)
  })

  it('OMEGA veta un borrador con frases peligrosas', () => {
    expect(activateAgent(context({ draft: { prompt: 'usa bypass' } }), 'c1', true).ok).toBe(false)
  })

  it('el techo frena una nueva activacion', () => {
    expect(activateAgent(context({ activeCount: 3 }), 'c1', true).ok).toBe(false)
  })

  it('sin borrador no hay nada que activar', () => {
    expect(activateAgent(context({ draft: null }), 'c1', true).ok).toBe(false)
  })
})

describe('deactivateAgent', () => {
  it('desactiva un borrador existente', () => {
    expect(deactivateAgent(context(), 'c1').ok).toBe(true)
  })
})
