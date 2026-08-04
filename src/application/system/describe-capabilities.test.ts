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
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over
  }
}

function repo(list: readonly StoredCapability[]): CapabilityRepository {
  return { add: () => stored(), listAll: () => list, findById: () => null }
}

describe('describeCapabilities', () => {
  it('deriva episodios, fase y madurez del historial real', () => {
    const ledger = { episodeTallySince: () => ({ episodes: 20_000, failures: 0 }) }
    const [c] = describeCapabilities(repo([stored({ id: 'a' })]), ledger)
    expect(c.episodes).toBe(20_000)
    expect(c.phase).toBe('ciclo')
    expect(c.maturity).toBe(20_000)
  })

  it('sin ejecuciones la capacidad esta en propuesta con madurez 0', () => {
    const ledger = { episodeTallySince: () => ({ episodes: 0, failures: 0 }) }
    const [c] = describeCapabilities(repo([stored()]), ledger)
    expect(c.phase).toBe('propuesta')
    expect(c.maturity).toBe(0)
  })

  it('los fallos reales bajan la madurez', () => {
    const ledger = { episodeTallySince: () => ({ episodes: 100, failures: 50 }) }
    expect(describeCapabilities(repo([stored()]), ledger)[0].maturity).toBe(50)
  })
})
