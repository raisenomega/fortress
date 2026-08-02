import { describe, expect, it } from 'vitest'
import type { DetectedFinding } from '../scan/detected-finding'
import { effectiveness, findingOutcome } from './agent-stats'

const secret: DetectedFinding = {
  severity: 'CRITICAL',
  title: 'API key hardcodeada',
  file: 'src/config.js',
  line: 1
}
const sql: DetectedFinding = {
  severity: 'CRITICAL',
  title: 'SQL injection',
  file: 'src/db.js',
  line: 3
}
const abierto = { ...sql, status: 'open' }
const descartado = { ...secret, status: 'false_positive' }

describe('findingOutcome', () => {
  it('lo reportado que ya no aparece cuenta como resuelto', () => {
    const outcome = findingOutcome([secret, sql], [abierto])
    expect(outcome).toEqual({ reported: 2, resolved: 1, dismissed: 0, open: 1 })
  })

  it('lo descartado no cuenta como resuelto: sigue ahi, solo que ignorado', () => {
    const outcome = findingOutcome([secret], [descartado])
    expect(outcome).toEqual({ reported: 1, resolved: 0, dismissed: 1, open: 0 })
  })

  it('no cuenta dos veces el mismo hallazgo repetido entre escaneos', () => {
    const outcome = findingOutcome([secret, secret, secret], [])
    expect(outcome.reported).toBe(1)
    expect(outcome.resolved).toBe(1)
  })

  it('sin nada reportado, todo a cero', () => {
    expect(findingOutcome([], [])).toEqual({ reported: 0, resolved: 0, dismissed: 0, open: 0 })
  })
})

describe('effectiveness', () => {
  it('es la proporcion de lo reportado que se arreglo', () => {
    expect(effectiveness({ reported: 4, resolved: 3, dismissed: 0, open: 1 })).toBe(0.75)
  })

  it('sin hallazgos reportados no hay porcentaje, hay ausencia de dato', () => {
    // Un 0% diria que el agente trabaja mal; la verdad es que no ha trabajado.
    expect(effectiveness({ reported: 0, resolved: 0, dismissed: 0, open: 0 })).toBeNull()
  })
})
