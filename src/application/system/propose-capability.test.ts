import { describe, expect, it } from 'vitest'
import type { NewCapability, StoredCapability } from '@domain/system/capability'
import type { CapabilityRepository } from '@domain/system/capability-repository'
import type { AppContext } from '../context'
import { proposeCapability } from './propose-capability'

function context(): { ctx: AppContext; added: NewCapability[] } {
  const added: NewCapability[] = []
  const capabilities: CapabilityRepository = {
    add: (c) => {
      added.push(c)
      return { ...c, id: 'c1', phase: 'propuesta', createdAt: 'now' } as StoredCapability
    },
    listAll: () => [],
    findById: () => null,
    promote: () => {}
  }
  return { ctx: { capabilities } as unknown as AppContext, added }
}

const input = (over: Partial<NewCapability> = {}): NewCapability => ({
  kind: 'agente',
  name: 'Redactor',
  originObservation: 'manual',
  ...over
})

describe('proposeCapability', () => {
  it('crea la capacidad en propuesta', () => {
    const { ctx, added } = context()
    const r = proposeCapability(ctx, input())
    expect(r.ok && r.value.phase).toBe('propuesta')
    expect(added).toHaveLength(1)
  })

  it('rechaza un nombre vacio', () => {
    expect(proposeCapability(context().ctx, input({ name: '   ' })).ok).toBe(false)
  })

  it('rechaza un tipo invalido', () => {
    expect(proposeCapability(context().ctx, input({ kind: 'x' as NewCapability['kind'] })).ok).toBe(
      false
    )
  })
})
