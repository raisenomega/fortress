import { describe, expect, it } from 'vitest'
import type { Severity } from '../shared/severity'
import type { PostureFinding } from './posture-finding'
import { postureScore } from './posture-score'

function finding(severity: Severity): PostureFinding {
  return {
    family: 'headers',
    severity,
    title: `hallazgo ${severity}`,
    evidence: 'header ausente',
    fix: 'declarar el header'
  }
}

describe('postureScore', () => {
  it('devuelve 100 sin hallazgos', () => {
    expect(postureScore([])).toBe(100)
  })

  it('resta 1 por cada LOW', () => {
    expect(postureScore([finding('LOW')])).toBe(99)
  })

  it('resta 4 por cada MEDIUM', () => {
    expect(postureScore([finding('MEDIUM')])).toBe(96)
  })

  it('resta 10 por cada HIGH', () => {
    expect(postureScore([finding('HIGH')])).toBe(90)
  })

  it('acumula la penalizacion de varios hallazgos', () => {
    expect(postureScore([finding('HIGH'), finding('MEDIUM'), finding('LOW')])).toBe(85)
  })

  it('deja el score en la banda de riesgo con un solo CRITICAL', () => {
    expect(postureScore([finding('CRITICAL')])).toBe(64)
  })

  it('aplica el techo de CRITICAL aunque el resto este limpio', () => {
    const score = postureScore([finding('CRITICAL'), finding('LOW')])
    expect(score).toBeLessThanOrEqual(64)
  })

  it('no sube por encima del techo cuando la penalizacion es menor', () => {
    expect(postureScore([finding('CRITICAL'), finding('MEDIUM')])).toBe(64)
  })

  it('usa la penalizacion real cuando baja del techo de CRITICAL', () => {
    const findings = [finding('CRITICAL'), ...Array.from({ length: 3 }, () => finding('HIGH'))]
    expect(postureScore(findings)).toBe(45)
  })

  it('nunca baja de 0 por muchos hallazgos que haya', () => {
    const findings = Array.from({ length: 40 }, () => finding('CRITICAL'))
    expect(postureScore(findings)).toBe(0)
  })

  it('es determinista: el orden de los hallazgos no cambia el numero', () => {
    const findings = [finding('LOW'), finding('CRITICAL'), finding('HIGH'), finding('MEDIUM')]
    expect(postureScore(findings)).toBe(postureScore([...findings].reverse()))
  })
})
