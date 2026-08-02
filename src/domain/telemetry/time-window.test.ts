import { describe, expect, it } from 'vitest'
import { windowStart } from './time-window'

const AHORA = new Date('2026-08-02T15:30:00.000Z')

describe('windowStart', () => {
  it('hoy empieza a medianoche, no hace 24 horas', () => {
    // Quien pregunta "cuanto llevo hoy" no se refiere a ayer por la tarde.
    const inicio = new Date(windowStart(AHORA, 'hoy'))
    expect(inicio.getHours()).toBe(0)
    expect(inicio.getMinutes()).toBe(0)
    expect(inicio.getTime()).toBeLessThanOrEqual(AHORA.getTime())
  })

  it('la semana retrocede siete dias', () => {
    expect(windowStart(AHORA, 'semana')).toBe('2026-07-26T15:30:00.000Z')
  })

  it('el mes retrocede treinta dias', () => {
    expect(windowStart(AHORA, 'mes')).toBe('2026-07-03T15:30:00.000Z')
  })

  it('las ventanas se ordenan de la mas corta a la mas larga', () => {
    const hoy = windowStart(AHORA, 'hoy')
    const semana = windowStart(AHORA, 'semana')
    const mes = windowStart(AHORA, 'mes')
    expect(mes < semana).toBe(true)
    expect(semana < hoy).toBe(true)
  })
})
