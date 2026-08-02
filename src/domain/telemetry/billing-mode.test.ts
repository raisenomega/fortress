import { describe, expect, it } from 'vitest'
import { costHint, costLabel, savingHint, UNKNOWN_BILLING } from './billing-mode'

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

  it('con API key avisa de que es dinero real', () => {
    // FORTRESS inyecta su key al CLI, y eso anula la suscripcion: lo que se
    // consume aparece facturado en la consola de Anthropic.
    expect(costHint({ mode: 'api', plan: null })).toContain('dinero real')
  })

  it('sin saberlo no afirma ninguna de las dos cosas', () => {
    const hint = costHint(UNKNOWN_BILLING)
    expect(hint).not.toContain('cubre')
    expect(hint).not.toContain('cobrado')
  })
})

describe('savingHint', () => {
  it('con API key propia y suscripcion disponible, senala el ahorro', () => {
    const hint = savingHint({ mode: 'api', plan: null }, true)
    expect(hint).toContain('Quitando la API key')
  })

  it('ya en suscripcion no hay nada que ahorrar', () => {
    expect(savingHint({ mode: 'suscripcion', plan: 'max' }, true)).toBeNull()
  })

  it('sin suscripcion detras, no propone quitar la key', () => {
    // Quitarla sin plan que la respalde dejaria la app sin poder ejecutar.
    expect(savingHint({ mode: 'api', plan: null }, false)).toBeNull()
  })
})
