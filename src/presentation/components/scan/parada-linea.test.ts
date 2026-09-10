import { describe, expect, it } from 'vitest'
import { hayParadaQueEnsenar, lineaDeParada } from './parada-linea'

const PARADA = { hecha: 4, total: 12, carpeta: 'auth' }

describe('la linea del recorrido', () => {
  it('dice por donde va, con la carpeta', () => {
    expect(lineaDeParada(PARADA)).toBe('Parada 4 de 12 · auth')
  })

  it('vale para una ruta de dos segmentos', () => {
    expect(lineaDeParada({ hecha: 1, total: 3, carpeta: 'apps/api' })).toBe('Parada 1 de 3 · apps/api') // prettier-ignore
  })
})

describe('cuando se ensena', () => {
  it('solo si ESTE proyecto escanea y ya cerro una parada', () => {
    expect(hayParadaQueEnsenar(true, PARADA)).toBe(true)
  })

  it('no si no hay escaneo en marcha, aunque quede la parada del anterior', () => {
    expect(hayParadaQueEnsenar(false, PARADA)).toBe(false)
  })

  it('no en un escaneo de una pieza: no reporta ninguna parada', () => {
    expect(hayParadaQueEnsenar(true, null)).toBe(false)
  })
})
