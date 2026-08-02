import { describe, expect, it } from 'vitest'
import { formatDuration, formatMoment } from './time'

describe('formatDuration', () => {
  it('omite los minutos cuando no los hay', () => {
    expect(formatDuration(12_000)).toBe('12s')
  })

  it('rellena los segundos a dos digitos', () => {
    expect(formatDuration(63_000)).toBe('1m 03s')
  })

  it('redondea al segundo mas cercano', () => {
    expect(formatDuration(1600)).toBe('2s')
  })

  it('no muestra tiempos negativos', () => {
    expect(formatDuration(-5000)).toBe('0s')
  })
})

describe('formatMoment', () => {
  it('no revienta con una fecha invalida', () => {
    expect(formatMoment('no soy una fecha')).toBe('fecha desconocida')
  })

  it('devuelve algo legible para un ISO valido', () => {
    expect(formatMoment('2026-08-02T05:00:00.000Z')).toMatch(/2026/)
  })
})
