import { describe, expect, it } from 'vitest'
import { nextMilestone, phaseFor, requiresHumanApproval } from './capability-lifecycle'

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
