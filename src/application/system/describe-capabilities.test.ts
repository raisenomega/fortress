import { describe, expect, it } from 'vitest'
import type { StoredCapability } from '@domain/system/capability'
import type { CapabilityRepository } from '@domain/system/capability-repository'
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

describe('describeCapabilities', () => {
  it('deriva episodios, madurez y elegibilidad del historial real', () => {
    const ledger = { episodeTallySince: () => ({ episodes: 20_000, failures: 0 }) }
    const [c] = describeCapabilities(repo([stored({ id: 'a' })]), ledger)
    expect(c.episodes).toBe(20_000)
    expect(c.maturity).toBe(20_000)
    // La fase es la APROBADA (arranca en propuesta); los episodios solo la hacen elegible.
    expect(c.phase).toBe('propuesta')
    expect(c.promotion).toMatchObject({ eligible: true, to: 'prueba' })
  })

  it('sin ejecuciones esta en propuesta, madurez 0 y no elegible', () => {
    const ledger = { episodeTallySince: () => ({ episodes: 0, failures: 0 }) }
    const [c] = describeCapabilities(repo([stored()]), ledger)
    expect(c.phase).toBe('propuesta')
    expect(c.maturity).toBe(0)
    expect(c.promotion.eligible).toBe(false)
  })

  it('los fallos reales bajan la madurez y disparan el veto de OMEGA', () => {
    const ledger = { episodeTallySince: () => ({ episodes: 100, failures: 50 }) }
    const [c] = describeCapabilities(repo([stored()]), ledger)
    expect(c.maturity).toBe(50)
    expect(c.omegaVeto.vetoed).toBe(true)
  })
})
