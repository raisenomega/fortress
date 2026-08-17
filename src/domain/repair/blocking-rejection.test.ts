import { describe, expect, it } from 'vitest'
import type { Proposal, ProposalState } from './proposal'
import { hasBlockingRejection } from './retry-eligibility'

const HEAD = 'abc1234'

function propuesta(patch: Partial<Proposal> = {}): Proposal {
  return {
    id: 'prop-1',
    projectId: 'p1',
    findingId: 'f1',
    baseSha: HEAD,
    state: 'RECHAZADO' as ProposalState,
    analysisReason: 'gate_failed_at=typecheck',
    createdAt: 1000,
    updatedAt: 1000,
    ...patch
  }
}

describe('hasBlockingRejection: el hallazgo que ya fracaso sobre esta misma base', () => {
  it('sin propuestas previas no bloquea nada', () => {
    expect(hasBlockingRejection('f1', HEAD, [])).toBe(false)
  })

  it('bloquea el rechazo del gate mientras el arbol no se mueva', () => {
    expect(hasBlockingRejection('f1', HEAD, [propuesta()])).toBe(true)
  })

  it('en cuanto el HEAD avanza, el hallazgo vuelve a la baraja', () => {
    expect(hasBlockingRejection('f1', 'otro-sha', [propuesta()])).toBe(false)
  })

  it('un rechazo reintentable no bloquea: para eso esta el reintento', () => {
    const vetada = propuesta({ analysisReason: 'omega_vetado: no cubre la fuga' })
    expect(hasBlockingRejection('f1', HEAD, [vetada])).toBe(false)
  })

  it('una propuesta que no esta rechazada no bloquea', () => {
    for (const state of ['ANALIZADO', 'GATE', 'MERGEADO', 'CADUCADO'] as const) {
      expect(hasBlockingRejection('f1', HEAD, [propuesta({ state })])).toBe(false)
    }
  })

  it('manda la ULTIMA: un rechazo viejo no pesa sobre un intento posterior vivo', () => {
    const vieja = propuesta({ id: 'prop-0', createdAt: 500 })
    const nueva = propuesta({ id: 'prop-2', state: 'ANALIZADO', createdAt: 2000 })
    expect(hasBlockingRejection('f1', HEAD, [nueva, vieja])).toBe(false)
    // Y al reves: el rechazo posterior si bloquea, aunque antes hubiera otra.
    const rechazoNuevo = propuesta({ id: 'prop-3', createdAt: 3000 })
    expect(hasBlockingRejection('f1', HEAD, [vieja, nueva, rechazoNuevo])).toBe(true)
  })

  it('el rechazo de OTRO hallazgo no bloquea a este', () => {
    expect(hasBlockingRejection('f2', HEAD, [propuesta()])).toBe(false)
  })
})
