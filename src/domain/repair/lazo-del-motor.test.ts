import { describe, expect, it } from 'vitest'
import { decidirOtraVuelta, type EstadoDelLazo, type LoQueDejoLaVuelta } from './lazo-del-motor'
import { TOPE_DE_VUELTAS, TOPE_POR_PROPUESTA_USD } from './topes-del-lazo'

const dejo = (extra: Partial<LoQueDejoLaVuelta> = {}): LoQueDejoLaVuelta => ({
  resuelve: 'PARCIAL',
  huella: 'h1',
  sesion: 'ses-1',
  ...extra
})

const estado = (extra: Partial<EstadoDelLazo> = {}): EstadoDelLazo => ({
  vueltasDadas: 1,
  huellasVistas: [],
  gastadoUsd: 1,
  ...extra
})

describe('decidirOtraVuelta: el disparo es un EJE dentro de un aprobado', () => {
  it('un PARCIAL con sesion, huella nueva y margen: otra vuelta, y con QUE sesion', () => {
    expect(decidirOtraVuelta(dejo(), estado())).toEqual({ seguir: true, sesion: 'ses-1' })
  })

  it('COMPLETO no es trabajo pendiente: el lazo no se dispara', () => {
    expect(decidirOtraVuelta(dejo({ resuelve: 'SI' }), estado())).toEqual({ seguir: false, parada: 'completo' }) // prettier-ignore
  })

  it('sin sesion no hay a que volver: no se reintenta a ciegas', () => {
    expect(decidirOtraVuelta(dejo({ sesion: null }), estado())).toEqual({ seguir: false, parada: 'sin-sesion' }) // prettier-ignore
  })

  it('sin huella no se puede saber si avanza: no se gira a ciegas', () => {
    expect(decidirOtraVuelta(dejo({ huella: null }), estado())).toEqual({ seguir: false, parada: 'sin-huella' }) // prettier-ignore
  })
})

describe('decidirOtraVuelta: las paradas, y su ORDEN', () => {
  it('la huella repetida CONVERGE: el generador da vueltas', () => {
    const d = decidirOtraVuelta(dejo({ huella: 'h1' }), estado({ huellasVistas: ['h0', 'h1'] }))
    expect(d).toEqual({ seguir: false, parada: 'convergio' })
  })

  it('el tope de vueltas para cuando cada vuelta trae algo distinto', () => {
    const d = decidirOtraVuelta(dejo({ huella: 'nueva' }), estado({ vueltasDadas: TOPE_DE_VUELTAS })) // prettier-ignore
    expect(d).toEqual({ seguir: false, parada: 'tope-de-vueltas' })
  })

  it('CONVERGER manda sobre el contador: con las dos, la razon es la buena', () => {
    const d = decidirOtraVuelta(dejo({ huella: 'h1' }), estado({ vueltasDadas: TOPE_DE_VUELTAS, huellasVistas: ['h1'] })) // prettier-ignore
    expect(d).toEqual({ seguir: false, parada: 'convergio' })
  })

  it('el margen en dolares se RESERVA antes de empezar, no se predice', () => {
    const justo = TOPE_POR_PROPUESTA_USD - 0.5
    const d = decidirOtraVuelta(dejo({ huella: 'nueva' }), estado({ gastadoUsd: justo }))
    expect(d).toEqual({ seguir: false, parada: 'tope-de-dolares' })
    // Con margen de sobra, la misma vuelta sigue.
    expect(decidirOtraVuelta(dejo({ huella: 'nueva' }), estado({ gastadoUsd: 1 }))).toEqual({ seguir: true, sesion: 'ses-1' }) // prettier-ignore
  })
})
