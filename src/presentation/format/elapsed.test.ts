import { describe, expect, it } from 'vitest'
import { formatElapsed } from './elapsed'

describe('formatElapsed', () => {
  it('formatea minutos y segundos con dos digitos', () => {
    expect(formatElapsed(80_000)).toBe('1:20')
    expect(formatElapsed(5_000)).toBe('0:05')
  })

  it('no muestra tiempos negativos', () => {
    expect(formatElapsed(-1000)).toBe('0:00')
  })
})
