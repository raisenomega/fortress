import { describe, expect, it } from 'vitest'
import { normalizeScore, scoreBand } from './fortress-score'

describe('scoreBand', () => {
  it('clasifica por umbrales', () => {
    expect(scoreBand(92)).toBe('solido')
    expect(scoreBand(85)).toBe('solido')
    expect(scoreBand(78)).toBe('aceptable')
    expect(scoreBand(65)).toBe('aceptable')
    expect(scoreBand(64)).toBe('riesgo')
  })
})

describe('normalizeScore', () => {
  it('acota el rango y redondea', () => {
    expect(normalizeScore(-10)).toBe(0)
    expect(normalizeScore(140)).toBe(100)
    expect(normalizeScore(72.6)).toBe(73)
  })

  it('convierte valores no finitos en 0', () => {
    expect(normalizeScore(Number.NaN)).toBe(0)
  })
})
