import { describe, expect, it } from 'vitest'
import { LOOP_SELF_REPO_BLOCK } from '@domain/loop/loop-gate'
import type { AppContext } from '../context'
import { setProjectLoopEnabled } from './set-project-loop-enabled'

interface Opciones {
  readonly trusted?: boolean
  readonly caps?: boolean
}

/** Contexto minimo: un proyecto y los topes del loop en settings. */
function fixture(opts: Opciones = {}): { context: AppContext; state: { flag: boolean | null } } {
  const state = { flag: null as boolean | null }
  const context = {
    projects: {
      findById: () => ({ id: 'p1', path: '/repo/ajeno', trusted: opts.trusted ?? true }),
      setLoopEnabled: (_id: string, enabled: boolean): void => void (state.flag = enabled)
    },
    settings: { get: (): string | null => ((opts.caps ?? true) ? '5' : null) }
  } as unknown as AppContext
  return { context, state }
}

const ajeno = (): boolean => false
const propio = (): boolean => true

describe('setProjectLoopEnabled', () => {
  it('enciende con confianza, topes y repo ajeno', () => {
    const { context, state } = fixture()
    expect(setProjectLoopEnabled(context, 'p1', true, ajeno).ok).toBe(true)
    expect(state.flag).toBe(true)
  })

  it('el repo propio se RECHAZA y el flag no se toca', () => {
    const { context, state } = fixture()
    const result = setProjectLoopEnabled(context, 'p1', true, propio)
    expect(result.ok ? null : result.error).toBe(LOOP_SELF_REPO_BLOCK)
    expect(state.flag).toBeNull()
  })

  it('sin confianza se rechaza en el main, no en la UI', () => {
    const { context, state } = fixture({ trusted: false })
    expect(setProjectLoopEnabled(context, 'p1', true, ajeno).ok).toBe(false)
    expect(state.flag).toBeNull()
  })

  it('sin topes guardados se rechaza', () => {
    const { context, state } = fixture({ caps: false })
    expect(setProjectLoopEnabled(context, 'p1', true, ajeno).ok).toBe(false)
    expect(state.flag).toBeNull()
  })

  it('apagar no exige gate: siempre se puede, incluso en el repo propio', () => {
    const { context, state } = fixture({ trusted: false, caps: false })
    expect(setProjectLoopEnabled(context, 'p1', false, propio).ok).toBe(true)
    expect(state.flag).toBe(false)
  })
})
