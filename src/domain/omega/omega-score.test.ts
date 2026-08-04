import { describe, expect, it } from 'vitest'
import { bandFor, computeScore } from './omega-score'

const NONE = { runs: 0, failedRuns: 0, outputTokens: 0, verifiedFindings: 0 }

describe('computeScore', () => {
  it('todo cuadra y sin fallos: confiable absoluto', () => {
    const s = computeScore({ ...NONE, okChecks: 10, discrepancies: 0, runs: 5, verifiedFindings: 10 })
    expect(s.veracity).toBe(100)
    expect(s.compliance).toBe(100)
    expect(s.overall).toBe(100)
    expect(s.band).toBe('confiable-absoluto')
  })

  it('mitad de hallazgos son discrepancias: baja la veracidad', () => {
    const s = computeScore({ ...NONE, okChecks: 5, discrepancies: 5, runs: 4, verifiedFindings: 10 })
    expect(s.veracity).toBe(50)
  })

  it('sin hallazgos ni runs: sin datos, no inventa un numero', () => {
    const s = computeScore({ ...NONE, okChecks: 0, discrepancies: 0 })
    expect(s.veracity).toBeNull()
    expect(s.compliance).toBeNull()
    expect(s.overall).toBeNull()
    expect(s.band).toBe('sin-datos')
  })

  it('solo pondera lo que tiene datos (compliance sin veracidad)', () => {
    const s = computeScore({ ...NONE, okChecks: 0, discrepancies: 0, runs: 4, failedRuns: 1 })
    expect(s.veracity).toBeNull()
    expect(s.overall).toBe(75) // = compliance, unica dimension con datos
  })

  it('tokens por hallazgo es informativo, no entra al overall', () => {
    const s = computeScore({ okChecks: 2, discrepancies: 0, runs: 1, failedRuns: 0, outputTokens: 600, verifiedFindings: 2 })
    expect(s.tokensPerFinding).toBe(300)
    expect(s.overall).toBe(100) // veracidad+cumplimiento 100, la eficiencia no baja nada
  })
})

describe('bandFor', () => {
  it('mapea los umbrales del spec', () => {
    expect(bandFor(95)).toBe('confiable-absoluto')
    expect(bandFor(80)).toBe('generalmente-confiable')
    expect(bandFor(65)).toBe('cuestionable')
    expect(bandFor(45)).toBe('no-confiable')
    expect(bandFor(20)).toBe('no-usar')
    expect(bandFor(null)).toBe('sin-datos')
  })
})
