import { describe, expect, it } from 'vitest'
import { computeMaturity } from './capability-maturity'

describe('computeMaturity', () => {
  it('sin episodios el puntaje es 0', () => {
    expect(computeMaturity({ episodes: 0, failures: 0, complianceRate: 1 })).toBe(0)
  })

  it('episodios limpios y cumplidos valen su cuenta entera', () => {
    expect(computeMaturity({ episodes: 1_000, failures: 0, complianceRate: 1 })).toBe(1_000)
  })

  it('los fallos descuentan proporcionalmente', () => {
    expect(computeMaturity({ episodes: 100, failures: 50, complianceRate: 1 })).toBe(50)
  })

  it('el incumplimiento tambien baja la nota', () => {
    expect(computeMaturity({ episodes: 1_000, failures: 0, complianceRate: 0.8 })).toBe(800)
  })

  it('el puntaje nunca pasa de 50.000, aunque haya mas episodios', () => {
    expect(computeMaturity({ episodes: 100_000, failures: 0, complianceRate: 1 })).toBe(50_000)
  })
})
