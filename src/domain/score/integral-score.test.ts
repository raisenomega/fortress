import { describe, expect, it } from 'vitest'
import type { Severity } from '../shared/severity'
import { computeIntegralScore } from './integral-score'

const f = (...severities: Severity[]): { severity: Severity }[] =>
  severities.map((severity) => ({ severity }))

describe('computeIntegralScore', () => {
  it('todas medidas y limpias: global 100, no parcial', () => {
    const r = computeIntegralScore({
      seguridad: [],
      correctitud: [],
      tests: [],
      mantenibilidad: [],
      dependencias: [],
      operacion: []
    })
    expect(r.global).toBe(100)
    expect(r.partial).toBe(false)
    expect(r.missing).toEqual([])
  })

  it('dimension sin datos NO cuenta como 100: global parcial sobre las medidas', () => {
    // seguridad 100 (w30), correctitud 2 HIGH = 84 (w20). Media ponderada sobre 50.
    const r = computeIntegralScore({ seguridad: [], correctitud: f('HIGH', 'HIGH') })
    expect(r.global).toBe(94) // (100*30 + 84*20) / 50
    expect(r.partial).toBe(true)
    expect(r.missing).toContain('Tests')
    expect(r.missing).toContain('Dependencias')
  })

  it('un CRITICAL abierto impone techo 64 aunque el resto este perfecto', () => {
    const r = computeIntegralScore({
      seguridad: f('CRITICAL'),
      correctitud: [],
      tests: [],
      mantenibilidad: [],
      dependencias: [],
      operacion: []
    })
    expect(r.global).toBe(64)
  })

  it('sin ninguna dimension medida: global 0 y parcial con las 6 faltantes', () => {
    const r = computeIntegralScore({})
    expect(r.global).toBe(0)
    expect(r.partial).toBe(true)
    expect(r.missing).toHaveLength(6)
  })
})

describe('computeIntegralScore · sin datos vs medido', () => {
  it('null explicito = sin datos, distinto de [] (medida limpia = 100)', () => {
    const conNull = computeIntegralScore({ seguridad: [], tests: null })
    const medida = conNull.byDimension.find((d) => d.key === 'tests')
    expect(medida?.score).toBeNull()
    expect(conNull.byDimension.find((d) => d.key === 'seguridad')?.score).toBe(100)
  })

  it('score DIRECTO (sin tests = 0) cuenta como MEDIDO, no como sin datos', () => {
    const r = computeIntegralScore({ seguridad: [], tests: { score: 0 } })
    expect(r.byDimension.find((d) => d.key === 'tests')?.score).toBe(0)
    expect(r.missing).not.toContain('Tests')
    // seguridad 100 (w30) + tests 0 (w15) = 3000/45 = 67
    expect(r.global).toBe(67)
  })
})
