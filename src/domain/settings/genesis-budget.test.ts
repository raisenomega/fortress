import { describe, expect, it } from 'vitest'
import { genesisConfigured, parseGenesisBudget } from './genesis-budget'

describe('parseGenesisBudget', () => {
  it('lee gasto y episodios; acepta coma decimal', () => {
    expect(parseGenesisBudget('2,5', '10')).toEqual({ costCapUsd: 2.5, maxEpisodes: 10 })
  })

  it('sin fijar o invalido cae a 0', () => {
    expect(parseGenesisBudget(null, 'x')).toEqual({ costCapUsd: 0, maxEpisodes: 0 })
  })
})

describe('genesisConfigured', () => {
  it('solo listo si ambos topes son positivos', () => {
    expect(genesisConfigured({ costCapUsd: 5, maxEpisodes: 20 })).toBe(true)
    expect(genesisConfigured({ costCapUsd: 0, maxEpisodes: 20 })).toBe(false)
    expect(genesisConfigured({ costCapUsd: 5, maxEpisodes: 0 })).toBe(false)
  })
})
