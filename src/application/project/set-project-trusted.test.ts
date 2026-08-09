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
  it('revocar la confianza APAGA el flag y DETIENE el loop en curso', () => {
    const { context, state } = fixture()
    const stopped: string[] = []

    const result = setProjectTrusted(context, 'p1', false, (id) => stopped.push(id))

    expect(result.ok).toBe(true)
    expect(state.trusted).toBe(false)
    expect(state.flag).toBe(false)
    expect(stopped).toEqual(['p1'])
  })

  it('otorgar la confianza no toca el loop', () => {
    const { context, state } = fixture()
    const stopped: string[] = []

    setProjectTrusted(context, 'p1', true, (id) => stopped.push(id))

    expect(state.trusted).toBe(true)
    expect(state.flag).toBeNull()
    expect(stopped).toEqual([])
  })
})
