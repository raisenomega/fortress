import { describe, expect, it } from 'vitest'
import { genesisStop, type GenesisState } from './genesis-decision'

function state(over: Partial<GenesisState> = {}): GenesisState {
  return {
    cancelled: false,
    topeDiario: false,
    spentSession: 0,
    costCap: 10,
    episodesDone: 0,
    maxEpisodes: 20,
    hasWork: true,
    ...over
  }
}

describe('genesisStop', () => {
  it('puede seguir cuando hay trabajo y no toca ningun tope', () => {
    expect(genesisStop(state())).toBeNull()
  })

  it('la intervencion humana manda sobre todo', () => {
    expect(genesisStop(state({ cancelled: true, hasWork: false }))).toBe('detenido')
  })

  it('para al alcanzar el tope de gasto', () => {
    expect(genesisStop(state({ spentSession: 10 }))).toBe('tope-gasto')
  })

  it('para al alcanzar el tope de episodios', () => {
    expect(genesisStop(state({ episodesDone: 20 }))).toBe('tope-episodios')
  })

  it('para cuando no queda nada por avanzar', () => {
    expect(genesisStop(state({ hasWork: false }))).toBe('sin-trabajo')
  })
})

describe('el tope del DIA manda sobre el de la sesion', () => {
  it('con el dia gastado para, aunque la sesion tenga saldo de sobra', () => {
    // `spentSession` vuelve a cero en cada encendido: sin este freno bastaba
    // con reiniciar genesis para volver a gastar la cuenta entera.
    expect(genesisStop(state({ topeDiario: true, spentSession: 0, costCap: 100 }))).toBe('tope-diario') // prettier-ignore
  })

  it('la intervencion humana sigue mandando sobre el', () => {
    expect(genesisStop(state({ cancelled: true, topeDiario: true }))).toBe('detenido')
  })

  it('sin tope diario decide lo de siempre', () => {
    expect(genesisStop(state({ spentSession: 9, costCap: 5 }))).toBe('tope-gasto')
  })
})
