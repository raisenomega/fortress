import { describe, expect, it } from 'vitest'
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

  it('el repo propio ya se puede encender: correra hasta el gate, sin integrar', () => {
    // El rechazo incondicional protegia de un loop que editaba el arbol vivo.
    // Ese loop ya no existe. Ahora la garantia es el MODO —que `esHastaGate`
    // fuerza en el repo propio y nadie elige— y no la prohibicion de encender.
    const { context, state } = fixture()
    expect(setProjectLoopEnabled(context, 'p1', true, propio).ok).toBe(true)
    expect(state.flag).toBe(true)
  })

  it('y al repo propio se le exige lo mismo que a cualquiera', () => {
    // Que el modo lo proteja de integrar no lo exime de la confianza ni de los
    // topes: son frenos distintos y ninguno cubre al otro.
    const sinConfianza = fixture({ trusted: false })
    expect(setProjectLoopEnabled(sinConfianza.context, 'p1', true, propio).ok).toBe(false)
    expect(sinConfianza.state.flag).toBeNull()

    const sinTopes = fixture({ caps: false })
    expect(setProjectLoopEnabled(sinTopes.context, 'p1', true, propio).ok).toBe(false)
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
