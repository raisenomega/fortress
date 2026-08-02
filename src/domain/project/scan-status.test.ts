import { describe, expect, it } from 'vitest'
import type { Project } from './project'
import { pushVerdict, scanStatus } from './scan-status'

const project = (fortressScore: number, lastScan: string | null): Project => ({
  id: 'p1',
  name: 'Proyecto',
  path: '/tmp/p1',
  stack: 'node',
  gitRemote: null,
  gitBranch: 'main',
  fortressScore,
  lastScan,
  hasClaude: true,
  hasGraph: false,
  hasFortress: false,
  createdAt: '2026-08-01T00:00:00.000Z'
})

describe('scanStatus', () => {
  it('no interpreta el score de un proyecto sin escanear', () => {
    expect(scanStatus(project(0, null))).toBe('sin-escanear')
    expect(scanStatus(project(95, null))).toBe('sin-escanear')
  })

  it('clasifica por banda cuando hay escaneo', () => {
    const scanned = '2026-08-01T05:00:00.000Z'
    expect(scanStatus(project(92, scanned))).toBe('solido')
    expect(scanStatus(project(70, scanned))).toBe('aceptable')
    expect(scanStatus(project(40, scanned))).toBe('riesgo')
  })
})

describe('pushVerdict', () => {
  it('sin escaneo no afirma que este listo', () => {
    expect(pushVerdict(project(100, null))).toBe('desconocido')
  })

  it('bloquea el push de un proyecto en riesgo', () => {
    expect(pushVerdict(project(40, '2026-08-01T05:00:00.000Z'))).toBe('bloqueado')
  })

  it('permite el push de un proyecto solido', () => {
    expect(pushVerdict(project(92, '2026-08-01T05:00:00.000Z'))).toBe('listo')
  })
})
