import { describe, expect, it } from 'vitest'
import { tail } from './tail'

describe('tail', () => {
  it('n=0 o negativo: vacio', () => {
    expect(tail('hola', 0)).toBe('')
    expect(tail('hola', -5)).toBe('')
  })

  it('texto corto: entero, sin tocar', () => {
    expect(tail('corto', 100)).toBe('corto')
  })

  it('texto largo: conserva los ULTIMOS chars', () => {
    const texto = 'x'.repeat(5000) + 'FINAL'
    expect(tail(texto, 10).endsWith('FINAL')).toBe(true)
    expect(tail(texto, 10).length).toBeLessThanOrEqual(10)
  })

  it('corta en salto de linea si hay uno cerca: autopsia legible', () => {
    const texto = 'linea-vieja\nlinea-partida\nerror real aqui'
    const cortado = tail(texto, 25)
    expect(cortado).toBe('error real aqui')
  })

  it('sin salto en el corte: devuelve el trozo tal cual', () => {
    expect(tail('abcdefghij', 4)).toBe('ghij')
  })
})
