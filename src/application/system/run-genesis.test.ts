import { describe, expect, it } from 'vitest'
import type { GenesisBudget } from '@domain/settings/genesis-budget'
import { runGenesis, type GenesisDeps } from './run-genesis'

const BUDGET: GenesisBudget = { costCapUsd: 100, maxEpisodes: 100 }

function deps(over: Partial<GenesisDeps> = {}): GenesisDeps {
  return {
    nextCapability: () => 'c1',
    runEpisode: () => Promise.resolve(),
    advance: () => Promise.resolve(),
    spentSession: () => 0,
    isCancelled: () => false,
    wait: () => Promise.resolve(),
    emit: () => {},
    ...over
  }
}

describe('runGenesis', () => {
  it('para en sin-trabajo cuando ya no quedan capacidades', async () => {
    let n = 0
    const d = deps({ nextCapability: () => (n++ < 2 ? 'c1' : null) })
    expect(await runGenesis(d, BUDGET)).toBe('sin-trabajo')
  })

  it('para al alcanzar el tope de episodios', async () => {
    expect(await runGenesis(deps(), { costCapUsd: 100, maxEpisodes: 3 })).toBe('tope-episodios')
  })

  it('para al alcanzar el tope de gasto', async () => {
    let spent = 0
    const d = deps({
      runEpisode: () => {
        spent += 5
        return Promise.resolve()
      },
      spentSession: () => spent
    })
    expect(await runGenesis(d, { costCapUsd: 10, maxEpisodes: 100 })).toBe('tope-gasto')
  })

  it('la cancelacion humana para el bucle', async () => {
    expect(await runGenesis(deps({ isCancelled: () => true }), BUDGET)).toBe('detenido')
  })
})
