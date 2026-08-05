import { describe, expect, it } from 'vitest'
import { computeQualityScore } from './quality-score'

describe('computeQualityScore', () => {
  it('la nota general abarca TODAS las dimensiones, no solo seguridad', () => {
    const q = computeQualityScore([
      { agentId: 'security-reviewer', severity: 'HIGH' },
      { agentId: 'tdd-guide', severity: 'MEDIUM' },
      { agentId: 'refactor-cleaner', severity: 'LOW' }
    ])
    // 100 - 8 - 3 - 1
    expect(q.overall).toBe(88)
    const dims = q.byDimension.map((d) => d.dimension)
    expect(dims).toContain('Seguridad')
    expect(dims).toContain('Tests')
    expect(dims).toContain('Limpieza')
  })

  it('cada dimension lleva su propia nota', () => {
    const q = computeQualityScore([{ agentId: 'tdd-guide', severity: 'HIGH' }])
    const tests = q.byDimension.find((d) => d.dimension === 'Tests')
    expect(tests).toMatchObject({ score: 92, count: 1 })
  })

  it('una CRITICAL de seguridad tope la calidad general (porton duro)', () => {
    const q = computeQualityScore([
      { agentId: 'security-reviewer', severity: 'CRITICAL' },
      { agentId: 'tdd-guide', severity: 'LOW' }
    ])
    expect(q.overall).toBeLessThanOrEqual(64)
  })

  it('sin hallazgos, calidad general 100', () => {
    expect(computeQualityScore([]).overall).toBe(100)
  })
})
