import { describe, expect, it } from 'vitest'
import { loopConfigured, parseLoopBudget } from './loop-budget'

describe('parseLoopBudget', () => {
  it('sin fijar queda en 0 (el loop no esta listo)', () => {
    expect(parseLoopBudget(null, null)).toEqual({ costCapUsd: 0, maxCycles: 0 })
  })

  it('parsea coma decimal y numero de ciclos', () => {
    expect(parseLoopBudget('30,5', '5')).toEqual({ costCapUsd: 30.5, maxCycles: 5 })
  })

  it('negativos o basura caen a 0', () => {
    expect(parseLoopBudget('-1', 'abc')).toEqual({ costCapUsd: 0, maxCycles: 0 })
  })
})

describe('loopConfigured', () => {
  it('exige AMBOS topes positivos', () => {
    expect(loopConfigured({ costCapUsd: 30, maxCycles: 5 })).toBe(true)
    expect(loopConfigured({ costCapUsd: 0, maxCycles: 5 })).toBe(false)
    expect(loopConfigured({ costCapUsd: 30, maxCycles: 0 })).toBe(false)
  })
})
