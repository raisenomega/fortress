import { describe, expect, it } from 'vitest'
import type { DetectedFinding } from '../scan/detected-finding'
import { fingerprintOf } from './finding-fingerprint'

const finding = (overrides: Partial<DetectedFinding> = {}): DetectedFinding => ({
  severity: 'CRITICAL',
  title: 'API key hardcodeada',
  file: 'src/config.js',
  line: 1,
  ...overrides
})

describe('fingerprintOf', () => {
  it('es igual para el mismo hallazgo en dos escaneos', () => {
    expect(fingerprintOf(finding())).toBe(fingerprintOf(finding()))
  })

  it('ignora espacios y mayusculas del titulo', () => {
    const reformateado = finding({ title: '  API   KEY   Hardcodeada ' })
    expect(fingerprintOf(reformateado)).toBe(fingerprintOf(finding()))
  })

  it('distingue la misma linea con distinta severidad', () => {
    expect(fingerprintOf(finding({ severity: 'LOW' }))).not.toBe(fingerprintOf(finding()))
  })

  it('distingue el mismo problema en otro archivo o linea', () => {
    expect(fingerprintOf(finding({ file: 'src/otro.js' }))).not.toBe(fingerprintOf(finding()))
    expect(fingerprintOf(finding({ line: 2 }))).not.toBe(fingerprintOf(finding()))
  })

  it('un titulo distinto en la misma linea NO hereda el descarte', () => {
    // Falla del lado seguro: si el modelo reporta otro problema en la misma
    // linea, reaparece en vez de quedar silenciado por un descarte viejo.
    const otroProblema = finding({ title: 'Contrasena en texto plano' })
    expect(fingerprintOf(otroProblema)).not.toBe(fingerprintOf(finding()))
  })

  it('soporta hallazgos sin linea', () => {
    expect(fingerprintOf(finding({ line: null }))).toContain('|-|')
  })
})
