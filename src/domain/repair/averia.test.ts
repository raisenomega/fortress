import { describe, expect, it } from 'vitest'
import { esAveria, esTimeout } from './averia'

describe('esAveria: solo lo que se arregla esperando', () => {
  it('el proveedor caido si: un 429, la cuota o la red se curan con tiempo', () => {
    expect(esAveria('provider_error')).toBe(true)
    expect(esAveria('omega_error')).toBe(true)
  })

  it('NINGUN reloj es una averia, y los tres jueces se tratan igual', () => {
    // Es la pieza entera: dos de los tres drenajes del 23-ago murieron con el
    // pozo lleno porque el reloj de UNA propuesta se anuncio como caida del
    // proveedor. El gate ya lo hacia bien; ahora los tres.
    expect(esAveria('generator_timeout')).toBe(false)
    expect(esAveria('omega_timeout')).toBe(false)
    expect(esAveria('gate_timeout')).toBe(false)
  })

  it('un veto, un gate rojo o una correa rota son veredictos', () => {
    expect(esAveria('omega_vetado')).toBe(false)
    expect(esAveria('gate_failed')).toBe(false)
    expect(esAveria('scope_violation')).toBe(false)
    expect(esAveria('turnos_agotados')).toBe(false)
  })
})

describe('esTimeout: la casilla propia de los relojes', () => {
  it('los tres jueces, y con su sufijo si lo llevan', () => {
    expect(esTimeout('generator_timeout')).toBe(true)
    expect(esTimeout('gate_timeout')).toBe(true)
    expect(esTimeout('omega_timeout')).toBe(true)
    expect(esTimeout('omega_timeout: el juez no contesto')).toBe(true)
  })

  it('lo que no es un reloj no entra, ni por parecerse en el prefijo', () => {
    expect(esTimeout('gate_failed')).toBe(false)
    expect(esTimeout('provider_error')).toBe(false)
    expect(esTimeout('turnos_agotados')).toBe(false)
    expect(esTimeout('timeout_de_otra_cosa')).toBe(false)
  })
})
