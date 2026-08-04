import { describe, expect, it } from 'vitest'
import type { OmegaGateVerdict } from './capability-gate'
import { canPromote, evaluatePromotion, nextPhase } from './capability-promotion'

const CLEAR: OmegaGateVerdict = { vetoed: false, band: 'generalmente-confiable', reason: null }
const VETO: OmegaGateVerdict = { vetoed: true, band: 'no-usar', reason: 'OMEGA veta' }

describe('nextPhase', () => {
  it('avanza un escalon; null cuando ya es oficial', () => {
    expect(nextPhase('propuesta')).toBe('prueba')
    expect(nextPhase('ciclo')).toBe('oficial')
    expect(nextPhase('oficial')).toBeNull()
  })
})

describe('evaluatePromotion', () => {
  it('elegible cuando los episodios pasan el siguiente umbral', () => {
    const p = evaluatePromotion('funcion', 'propuesta', 1_500, CLEAR)
    expect(p).toMatchObject({ eligible: true, to: 'prueba', needsHuman: false, blocked: false })
  })

  it('sin episodios suficientes no es elegible', () => {
    expect(evaluatePromotion('funcion', 'propuesta', 500, CLEAR).eligible).toBe(false)
  })

  it('un agente marca needsHuman; el veto de OMEGA marca blocked', () => {
    const p = evaluatePromotion('agente', 'prueba', 20_000, VETO)
    expect(p).toMatchObject({ eligible: true, needsHuman: true, blocked: true })
  })
})

describe('canPromote', () => {
  const base = { eligible: true, to: 'prueba' as const, needsHuman: false, blocked: false }

  it('una funcion reversible salta sin humano', () => {
    expect(canPromote(base, false)).toBe(true)
  })

  it('el veto de OMEGA frena aunque haya humano', () => {
    expect(canPromote({ ...base, blocked: true }, true)).toBe(false)
  })

  it('un agente exige humano', () => {
    expect(canPromote({ ...base, needsHuman: true }, false)).toBe(false)
    expect(canPromote({ ...base, needsHuman: true }, true)).toBe(true)
  })

  it('sin elegibilidad no hay salto', () => {
    expect(canPromote({ ...base, eligible: false }, true)).toBe(false)
  })
})
