import { describe, expect, it } from 'vitest'
import type { StoredCapability } from '@domain/system/capability'
import type { CapabilityRepository } from '@domain/system/capability-repository'
import type { CapabilityEpisode, EpisodeTally } from '@domain/system/capability-episode'
import type { CapabilityEpisodeRepository } from '@domain/system/capability-episode-repository'
import { describeCapabilities } from './describe-capabilities'

function stored(over: Partial<StoredCapability> = {}): StoredCapability {
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

function repo(list: readonly StoredCapability[]): CapabilityRepository {
  return { add: () => stored(), listAll: () => list, findById: () => null, promote: () => {} }
}

function episodes(tally: EpisodeTally): CapabilityEpisodeRepository {
  return { record: () => ({}) as CapabilityEpisode, listFor: () => [], tallyFor: () => tally }
}

describe('describeCapabilities', () => {
  it('deriva madurez y elegibilidad de sus propios episodios', () => {
    const [c] = describeCapabilities(repo([stored({ id: 'a' })]), episodes({ episodes: 20_000, failures: 0 }))
    expect(c.episodes).toBe(20_000)
    expect(c.maturity).toBe(20_000)
    expect(c.phase).toBe('propuesta') // la fase es la APROBADA; los episodios solo hacen elegible
    expect(c.promotion).toMatchObject({ eligible: true, to: 'prueba' })
  })

  it('sin episodios esta en propuesta, madurez 0 y no elegible', () => {
    const [c] = describeCapabilities(repo([stored()]), episodes({ episodes: 0, failures: 0 }))
    expect(c.maturity).toBe(0)
    expect(c.promotion.eligible).toBe(false)
  })

  it('los fallos reales bajan la madurez y disparan el veto de OMEGA', () => {
    const [c] = describeCapabilities(repo([stored()]), episodes({ episodes: 100, failures: 50 }))
    expect(c.maturity).toBe(50)
    expect(c.omegaVeto.vetoed).toBe(true)
  })
})
