import { describe, expect, it } from 'vitest'
import { leerEvidencia } from './leer-evidencia'

describe('la evidencia que no se entiende no cuenta como media prueba', () => {
  it('lee el par completo, y el commit cuando viene', () => {
    expect(leerEvidencia({ marcador: 'execFile(', forma: 'ausente' })).toEqual({
      marcador: 'execFile(',
      forma: 'ausente'
    })
    expect(leerEvidencia({ marcador: 'x', forma: 'presente', commit: 'd9af784' })?.commit).toBe('d9af784') // prettier-ignore
  })

  it('una forma inventada por el modelo no se cuela', () => {
    // Sin el vocabulario cerrado, cualquier tercera palabra caeria del lado de
    // `ausente` en la comparacion, y nadie habria decidido eso.
    expect(leerEvidencia({ marcador: 'x', forma: 'resuelto' })).toBeUndefined()
    expect(leerEvidencia({ marcador: 'x', forma: 'AUSENTE' })).toBeUndefined()
  })

  it('sin marcador no hay evidencia, aunque la forma sea buena', () => {
    expect(leerEvidencia({ marcador: '  ', forma: 'ausente' })).toBeUndefined()
    expect(leerEvidencia({ forma: 'ausente' })).toBeUndefined()
  })

  it('lo que no es un objeto no se interpreta', () => {
    expect(leerEvidencia(undefined)).toBeUndefined()
    expect(leerEvidencia(null)).toBeUndefined()
    expect(leerEvidencia('el commit d9e3194 lo arreglo')).toBeUndefined()
  })
})
