import { describe, expect, it } from 'vitest'
import type { Capability, CapabilityKind, CapabilityPhase } from './capability'
import {
  canPromote,
  nextMilestone,
  phaseFor,
  requiresHumanApproval
} from './capability-lifecycle'

function cap(episodes: number, phase: CapabilityPhase, kind: CapabilityKind = 'funcion'): Capability {
  return {
    id: 'c1',
    kind,
    name: 'nueva',
    originObservation: 'o1',
    episodes,
    phase,
    maturity: 0,
    createdAt: '2026-08-04T00:00:00.000Z'
  }
}

describe('phaseFor', () => {
  it('cruza cada umbral en el episodio exacto', () => {
    expect(phaseFor(999)).toBe('propuesta')
    expect(phaseFor(1_000)).toBe('prueba')
    expect(phaseFor(19_999)).toBe('prueba')
    expect(phaseFor(20_000)).toBe('ciclo')
    expect(phaseFor(49_999)).toBe('ciclo')
    expect(phaseFor(50_000)).toBe('oficial')
  })
})

describe('nextMilestone', () => {
  it('cuenta los episodios que faltan, null si ya es oficial', () => {
    expect(nextMilestone(0)).toBe(1_000)
    expect(nextMilestone(1_000)).toBe(19_000)
    expect(nextMilestone(20_000)).toBe(30_000)
    expect(nextMilestone(50_000)).toBeNull()
  })
})

describe('requiresHumanApproval', () => {
  it('solo un agente nuevo exige humano; lo reversible no', () => {
    expect(requiresHumanApproval('agente')).toBe(true)
    expect(requiresHumanApproval('funcion')).toBe(false)
    expect(requiresHumanApproval('herramienta')).toBe(false)
  })
})

describe('canPromote', () => {
  it('sin cruzar umbral no promociona aunque OMEGA apruebe', () => {
    expect(canPromote(cap(1_500, 'prueba'), { omegaApproved: true, humanApproved: true })).toBe(false)
  })

  it('OMEGA es testigo-no-actor: sin su ok, no hay salto', () => {
    expect(canPromote(cap(20_000, 'prueba'), { omegaApproved: false, humanApproved: true })).toBe(false)
  })

  it('una funcion reversible salta solo con OMEGA', () => {
    expect(canPromote(cap(20_000, 'prueba'), { omegaApproved: true, humanApproved: false })).toBe(true)
  })

  it('un agente nuevo exige ademas humano', () => {
    const g = { omegaApproved: true, humanApproved: false }
    expect(canPromote(cap(20_000, 'prueba', 'agente'), g)).toBe(false)
    expect(canPromote(cap(20_000, 'prueba', 'agente'), { ...g, humanApproved: true })).toBe(true)
  })
})
