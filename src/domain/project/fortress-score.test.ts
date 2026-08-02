import { describe, expect, it } from 'vitest'
import { countBySeverity, isPushReady, normalizeScore, scoreBand } from './fortress-score'
import type { Finding } from './project'

const finding = (severity: Finding['severity']): Finding => ({
  id: `${severity}-1`,
  severity,
  title: 'hallazgo',
  file: 'src/app.ts',
  line: 1
})

describe('isPushReady', () => {
  it('permite push sin hallazgos', () => {
    expect(isPushReady([])).toBe(true)
  })

  it('bloquea el push con un solo CRITICAL', () => {
    expect(isPushReady([finding('LOW'), finding('CRITICAL')])).toBe(false)
  })

  it('permite push con HIGH pero sin CRITICAL', () => {
    expect(isPushReady([finding('HIGH'), finding('MEDIUM')])).toBe(true)
  })
})

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

describe('countBySeverity', () => {
  it('agrupa por severidad', () => {
    const counts = countBySeverity([finding('CRITICAL'), finding('HIGH'), finding('HIGH')])
    expect(counts).toEqual({ CRITICAL: 1, HIGH: 2 })
  })
})
