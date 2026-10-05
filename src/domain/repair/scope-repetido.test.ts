import { describe, expect, it } from 'vitest'
import type { Proposal, ProposalState } from './proposal'
import { hasBlockingRejection } from './bloqueo-por-rechazo'

const HEAD = 'abc1234'

/** Un intento del mismo hallazgo, rechazado por salirse de la correa. */
function intento(n: number, patch: Partial<Proposal> = {}): Proposal {
  return {
    id: `prop-${n}`,
    projectId: 'p1',
    findingId: 'f1',
    baseSha: HEAD,
    state: 'RECHAZADO' as ProposalState,
    analysisReason: 'scope_violation',
    createdAt: n * 1000,
    updatedAt: n * 1000,
    ...patch
  }
}

describe('el hallazgo que no cabe en la correa deja de reintentarse', () => {
  it('el primer intento no bloquea: pudo ser mala suerte del generador', () => {
    expect(hasBlockingRejection('f1', HEAD, [intento(1)], 'none')).toBe(false)
  })

  it('al segundo ya no es suerte: el fix correcto no cabe donde se le pide', () => {
    // El caso real: cuatro intentos identicos del mismo hallazgo, ocho dolares.
    expect(hasBlockingRejection('f1', HEAD, [intento(1), intento(2)], 'none')).toBe(true)
  })

  it('es PAUSA, no extincion: si el arbol se mueve, vuelve a la baraja', () => {
    const previos = [intento(1), intento(2)]
    expect(hasBlockingRejection('f1', 'otro-sha', previos, 'none')).toBe(false)
  })

  it('cuentan solo los intentos sobre la MISMA base: otro arbol, otro caso', () => {
    const enOtraBase = intento(1, { baseSha: 'viejo-sha' })
    expect(hasBlockingRejection('f1', HEAD, [enOtraBase, intento(2)], 'none')).toBe(false)
  })

  it('dos causas de RAZONAMIENTO si se suman: alternarlas no compra un tercero (ADR-115 B1)', () => {
    const vetado = intento(1, { analysisReason: 'omega_vetado: no cubre la fuga' })
    expect(hasBlockingRejection('f1', HEAD, [vetado, intento(2)], 'none')).toBe(true)
  })

  it('una averia y una de razonamiento siguen sin sumarse', () => {
    const corte = intento(1, { analysisReason: 'provider_error: 429' })
    expect(hasBlockingRejection('f1', HEAD, [corte, intento(2)], 'none')).toBe(false)
  })

  it('la razon con sufijo cuenta igual: es la misma causa', () => {
    const conDetalle = intento(1, { analysisReason: 'scope_violation: 2 ficheros' })
    expect(hasBlockingRejection('f1', HEAD, [conDetalle, intento(2)], 'none')).toBe(true)
  })
})
