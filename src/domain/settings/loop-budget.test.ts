import { describe, expect, it } from 'vitest'
import { CONFIGURADO } from './loop-budget-fixture'
import { loopConfigured, parseLoopBudget } from './loop-budget'

describe('parseLoopBudget: frenos duros', () => {
  it('sin fijar quedan en 0 (el loop no esta listo)', () => {
    const b = parseLoopBudget(null, null, null, null, null)
    expect(b.costCapUsd).toBe(0)
    expect(b.maxCycles).toBe(0)
  })

  it('parsea coma decimal y numero de propuestas', () => {
    const b = parseLoopBudget('30,5', '5', null, null, null)
    expect(b.costCapUsd).toBe(30.5)
    expect(b.maxCycles).toBe(5)
  })

  it('negativos o basura caen a 0', () => {
    const b = parseLoopBudget('-1', 'abc', null, null, null)
    expect(b.costCapUsd).toBe(0)
    expect(b.maxCycles).toBe(0)
  })
})

describe('loopConfigured', () => {
  it('exige los DOS frenos duros positivos', () => {
    expect(loopConfigured(CONFIGURADO)).toBe(true)
    expect(loopConfigured({ ...CONFIGURADO, costCapUsd: 0 })).toBe(false)
    expect(loopConfigured({ ...CONFIGURADO, maxCycles: 0 })).toBe(false)
  })

  it('las valvulas NO condicionan encender: sin ellas el loop sigue arrancando', () => {
    expect(loopConfigured({ ...CONFIGURADO, maxConsecutiveDenials: 0 })).toBe(true)
    expect(loopConfigured({ ...CONFIGURADO, maxConsecutiveNoCandidates: 0 })).toBe(true)
  })
})
