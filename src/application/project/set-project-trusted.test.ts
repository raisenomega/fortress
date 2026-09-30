import { describe, expect, it } from 'vitest'
import type { AppContext } from '../context'
import { setProjectTrusted } from './set-project-trusted'

/** Contexto minimo que registra lo que el caso de uso hace con el loop. */
function fixture(): {
  context: AppContext
  state: { trusted: boolean | null; flag: boolean | null }
} {
  const state = { trusted: null as boolean | null, flag: null as boolean | null }
  const context = {
    projects: {
      findById: () => ({ id: 'p1' }),
      setTrusted: (_id: string, trusted: boolean): void => void (state.trusted = trusted),
      setLoopEnabled: (_id: string, enabled: boolean): void => void (state.flag = enabled)
    }
  } as unknown as AppContext
  return { context, state }
}

describe('setProjectTrusted', () => {
  /**
   * ADR-107 retiro el loop, asi que ya no hay proceso que detener. El flag SI se
   * sigue apagando: la columna vive con su historia, y dejarla encendida en un
   * proyecto en el que ya no se confia seria un estado que miente.
   */
  it('revocar la confianza APAGA el flag del loop', () => {
    const { context, state } = fixture()

    const result = setProjectTrusted(context, 'p1', false)

    expect(result.ok).toBe(true)
    expect(state.trusted).toBe(false)
    expect(state.flag).toBe(false)
  })

  it('otorgar la confianza no toca el flag', () => {
    const { context, state } = fixture()

    setProjectTrusted(context, 'p1', true)

    expect(state.trusted).toBe(true)
    expect(state.flag).toBeNull()
  })
})
