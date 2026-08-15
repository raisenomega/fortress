import { describe, expect, it } from 'vitest'
import { DEFAULT_MAX_DENIALS, loopConfigured, parseLoopBudget } from './loop-budget'

const CONFIGURADO = { costCapUsd: 30, maxCycles: 5, maxConsecutiveDenials: 5 }

describe('parseLoopBudget: frenos duros', () => {
  it('sin fijar quedan en 0 (el loop no esta listo)', () => {
    const b = parseLoopBudget(null, null, null)
    expect(b.costCapUsd).toBe(0)
    expect(b.maxCycles).toBe(0)
  })

  it('parsea coma decimal y numero de propuestas', () => {
    const b = parseLoopBudget('30,5', '5', null)
    expect(b.costCapUsd).toBe(30.5)
    expect(b.maxCycles).toBe(5)
  })

  it('negativos o basura caen a 0', () => {
    const b = parseLoopBudget('-1', 'abc', null)
    expect(b.costCapUsd).toBe(0)
    expect(b.maxCycles).toBe(0)
  })
})

describe('parseLoopBudget: la valvula si trae valor', () => {
  it('sin fijar hereda el default', () => {
    expect(parseLoopBudget(null, null, null).maxConsecutiveDenials).toBe(DEFAULT_MAX_DENIALS)
  })

  it('basura tambien hereda el default: no hay intencion legible', () => {
    expect(parseLoopBudget(null, null, 'abc').maxConsecutiveDenials).toBe(DEFAULT_MAX_DENIALS)
  })

  it('un cero guardado es un cero, no una ausencia', () => {
    // Aplanar los dos en 0 haria indistinguible "no configurado" de lo que el
    // operador escribio a mano, y el default se comeria su decision.
    expect(parseLoopBudget(null, null, '0').maxConsecutiveDenials).toBe(0)
  })
})

describe('loopConfigured', () => {
  it('exige los DOS frenos duros positivos', () => {
    expect(loopConfigured(CONFIGURADO)).toBe(true)
    expect(loopConfigured({ ...CONFIGURADO, costCapUsd: 0 })).toBe(false)
    expect(loopConfigured({ ...CONFIGURADO, maxCycles: 0 })).toBe(false)
  })

  it('la valvula NO condiciona encender: sin ella el loop sigue pudiendo arrancar', () => {
    expect(loopConfigured({ ...CONFIGURADO, maxConsecutiveDenials: 0 })).toBe(true)
  })
})
