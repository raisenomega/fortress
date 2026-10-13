import { describe, expect, it } from 'vitest'
import { seExtinguio } from './se-extinguio'

describe('seExtinguio: solo un juicio real avanza la cola (ATERRIZAJE-5, ADR-065)', () => {
  it('EXTINCT -> true (extincion real con veredicto)', () => {
    expect(seExtinguio('EXTINCT')).toBe(true)
  })

  it('ACTIVE -> false (sigue vivo, se re-intenta)', () => {
    expect(seExtinguio('ACTIVE')).toBe(false)
  })

  it('MITIGATED -> false (mitigado NO es extinto)', () => {
    expect(seExtinguio('MITIGATED')).toBe(false)
  })

  it('AUSENCIA (null) -> false: la ausencia NO extingue (ADR-065)', () => {
    expect(seExtinguio(null)).toBe(false)
  })
})
