import { describe, expect, it } from 'vitest'
import { decidirOtraVuelta } from './lazo-del-motor'
import { TOPE_DE_VUELTAS, TOPE_POR_PROPUESTA_USD } from './topes-del-lazo'

/** ADR-115 B2: un rojo de codigo dispara el lazo igual que un PARCIAL, y con los
 *  MISMOS topes. No es un lazo aparte: si fuera aparte, cada disparo traeria su
 *  propio presupuesto y eso es un bucle de dinero. */
const rojo = { resuelve: 'ROJO' as const, huella: 'h1', sesion: 'ses-1' }
const recien = { vueltasDadas: 1, huellasVistas: [], gastadoUsd: 1 }

describe('el rojo de codigo dispara la vuelta', () => {
  it('tras la primera generacion, da la vuelta sobre la misma sesion', () => {
    expect(decidirOtraVuelta(rojo, recien)).toEqual({ seguir: true, sesion: 'ses-1' })
  })
})

describe('con los topes de siempre, compartidos con el PARCIAL', () => {
  it('ya dadas las vueltas del tope (incluida la primera), para', () => {
    expect(decidirOtraVuelta(rojo, { ...recien, vueltasDadas: TOPE_DE_VUELTAS })).toEqual({ seguir: false, parada: 'tope-de-vueltas' }) // prettier-ignore
  })
  it('sin dinero para otra vuelta, para', () => {
    expect(decidirOtraVuelta(rojo, { ...recien, gastadoUsd: TOPE_POR_PROPUESTA_USD })).toEqual({ seguir: false, parada: 'tope-de-dolares' }) // prettier-ignore
  })
  it('sin sesion que reanudar, para', () => {
    expect(decidirOtraVuelta({ ...rojo, sesion: null }, recien)).toEqual({ seguir: false, parada: 'sin-sesion' }) // prettier-ignore
  })
})
