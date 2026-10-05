import { describe, expect, it } from 'vitest'
import type { Proposal } from './proposal'
import { hasBlockingRejection } from './bloqueo-por-rechazo'

/**
 * ADR-115 B1. El freno contaba por causa SUELTA, y una alternancia lo esquivaba:
 * el hallazgo `1325a80a` (electron-builder) se compro tres veces sobre `0c36571`
 * con omega_vetado → no_diff_produced → omega_vetado. Ahora las causas de
 * RAZONAMIENTO comparten cuenta por hallazgo y base; las averias no la gastan.
 */
const HEAD = 'base-actual'
let t = 0
const rechazo = (analysisReason: string, baseSha = HEAD): Proposal => ({
  id: `p${++t}`, projectId: 'x', findingId: 'f1', baseSha, state: 'RECHAZADO',
  analysisReason, createdAt: t, updatedAt: t
}) // prettier-ignore
const frena = (...suyas: Proposal[]): boolean => hasBlockingRejection('f1', HEAD, suyas, 'h')

describe('el triaje cuenta por hallazgo y base, no por causa suelta', () => {
  it('electron-builder: tras un veto y un «sin diff», el tercero ya no se compra', () => {
    expect(frena(rechazo('omega_vetado: no da procedencia'), rechazo('no_diff_produced'))).toBe(true) // prettier-ignore
  })

  it('un solo rechazo de razonamiento sigue teniendo su segundo intento', () => {
    expect(frena(rechazo('scope_violation'))).toBe(false)
  })
})

describe('una averia no gasta el presupuesto del arreglo', () => {
  it('un veto y luego un «ilegible» (el 429 de Fable) NO frena', () => {
    expect(frena(rechazo('omega_vetado: x'), rechazo('analisis_ilegible: limite'))).toBe(false)
  })

  it('un «ilegible» y luego un veto tampoco', () => {
    expect(frena(rechazo('analisis_ilegible: limite'), rechazo('omega_vetado: x'))).toBe(false)
  })

  it('la averia conserva su propia cuenta: dos «ilegible» seguidos si frenan (9e6a4b7a)', () => {
    expect(frena(rechazo('omega_vetado: x'), rechazo('analisis_ilegible: a'), rechazo('analisis_ilegible: b'))).toBe(true) // prettier-ignore
  })
})

describe('el reintento al avanzar el HEAD no se toca', () => {
  it('los rechazos de una base vieja no cuentan en la nueva (74cf61e0 tras 88e17331)', () => {
    expect(frena(rechazo('omega_vetado: x', 'base-vieja'), rechazo('no_diff_produced'))).toBe(false)
  })

  it('frenado en una base, vuelve a la baraja cuando el HEAD avanza', () => {
    const suyas = [
      rechazo('omega_vetado: x', 'base-vieja'),
      rechazo('no_diff_produced', 'base-vieja')
    ]
    expect(hasBlockingRejection('f1', HEAD, suyas, 'h')).toBe(false)
  })
})
