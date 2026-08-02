import { describe, expect, it } from 'vitest'
import { costHint, costLabel, UNKNOWN_BILLING } from './billing-mode'

describe('costLabel', () => {
  it('con suscripcion no lo llama "coste": no hay factura', () => {
    expect(costLabel({ mode: 'suscripcion', plan: 'max' })).toBe('Equivalente')
  })

  it('con API key si es coste de verdad', () => {
    expect(costLabel({ mode: 'api', plan: null })).toBe('Coste')
  })
})

describe('costHint', () => {
  it('dice el plan que lo cubre, para que nadie crea que gasto dinero', () => {
    expect(costHint({ mode: 'suscripcion', plan: 'max' })).toContain('plan max lo cubre')
  })

  it('con API key avisa de que si se cobra', () => {
    expect(costHint({ mode: 'api', plan: null })).toContain('cobrado a tu API key')
  })

  it('sin saberlo no afirma ninguna de las dos cosas', () => {
    const hint = costHint(UNKNOWN_BILLING)
    expect(hint).not.toContain('cubre')
    expect(hint).not.toContain('cobrado')
  })
})
