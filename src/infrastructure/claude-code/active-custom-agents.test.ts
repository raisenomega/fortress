import { describe, expect, it } from 'vitest'
import type { StoredAgentDraft } from '@domain/system/agent-draft-repository'
import { activeCustomAgents } from './active-custom-agents'

const draft: StoredAgentDraft = {
  capabilityId: 'c1',
  name: 'Redactor',
  prompt: 'haz X',
  iconName: 'sparkles',
  active: true
}

describe('activeCustomAgents', () => {
  it('mapea borradores activos al payload --agents, clavado por capabilityId', () => {
    const payload = activeCustomAgents([draft])
    expect(payload.c1).toEqual({ description: 'Redactor', prompt: 'haz X' })
  })

  it('vacio si no hay activos: salida identica a antes', () => {
    expect(Object.keys(activeCustomAgents([]))).toHaveLength(0)
  })
})
