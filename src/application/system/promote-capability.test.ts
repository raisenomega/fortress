import { describe, expect, it } from 'vitest'
import type { StoredCapability } from '@domain/system/capability'
import type { CapabilityRepository } from '@domain/system/capability-repository'
import type { CapabilityEpisode } from '@domain/system/capability-episode'
import type { CapabilityEpisodeRepository } from '@domain/system/capability-episode-repository'
import type { AppContext } from '../context'
import { promoteCapability } from './promote-capability'

function fn(over: Partial<StoredCapability> = {}): StoredCapability {
  return {
    id: 'c1',
    kind: 'funcion',
    name: 'x',
    originObservation: 'o',
    phase: 'propuesta',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over
  }
}

function context(stored: StoredCapability, episodes: number, failures = 0): AppContext {
  let phase = stored.phase
  const capabilities: CapabilityRepository = {
    add: () => stored,
    listAll: () => [{ ...stored, phase }],
    findById: (id) => (id === stored.id ? { ...stored, phase } : null),
    promote: (_id, to) => {
      phase = to
    }
  }
  const capabilityEpisodes: CapabilityEpisodeRepository = {
    record: () => ({}) as CapabilityEpisode,
    listFor: () => [],
    tallyFor: () => ({ episodes, failures })
  }
  return { capabilities, capabilityEpisodes } as unknown as AppContext
}

describe('promoteCapability', () => {
  it('promueve una funcion reversible sin humano', () => {
    const r = promoteCapability(context(fn(), 1_500), 'c1', false)
    expect(r.ok && r.value.phase).toBe('prueba')
  })

  it('un agente nuevo no salta sin aprobacion humana', () => {
    expect(promoteCapability(context(fn({ kind: 'agente' }), 1_500), 'c1', false).ok).toBe(false)
  })

  it('con humano, el agente si salta', () => {
    const r = promoteCapability(context(fn({ kind: 'agente' }), 1_500), 'c1', true)
    expect(r.ok && r.value.phase).toBe('prueba')
  })

  it('OMEGA veta un salto con demasiados fallos', () => {
    expect(promoteCapability(context(fn(), 100, 50), 'c1', true).ok).toBe(false)
  })

  it('capacidad inexistente devuelve error', () => {
    expect(promoteCapability(context(fn(), 1_500), 'otra', true).ok).toBe(false)
  })
})
