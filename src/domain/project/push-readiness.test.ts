import { describe, expect, it } from 'vitest'
import type { Project } from './project'
import { pushState } from './push-readiness'
import { countFindings, EMPTY_COUNTS } from './severity-counts'

const SCANNED = '2026-08-02T05:00:00.000Z'

const project = (overrides: Partial<Project> = {}): Project => ({
  id: 'p1',
  name: 'Proyecto',
  path: '/tmp/p1',
  stack: 'node',
  gitRemote: 'git@github.com:acme/p1.git',
  gitBranch: 'main',
  fortressScore: 100,
  generalQuality: null,
  qualityDimensions: null,
  qualityPartial: false,
  lastScan: SCANNED,
  hasClaude: true,
  hasGraph: false,
  graphNodes: null,
  graphEdges: null,
  graphIndexedAt: null,
  hasFortress: false,
  trusted: false,
  loopEnabled: false,
  contaminated: false,
  contaminationDetail: null,
  configState: 'CONFIGURADO',
  createdAt: SCANNED,
  ...overrides
})

describe('pushState', () => {
  it('deja pasar un proyecto escaneado y sin CRITICAL', () => {
    expect(pushState(project(), countFindings([{ severity: 'HIGH' }]))).toBe('listo')
  })

  it('bloquea con un solo CRITICAL', () => {
    expect(pushState(project(), countFindings([{ severity: 'CRITICAL' }]))).toBe('criticals')
  })

  it('bloquea un proyecto sin escanear aunque no haya hallazgos', () => {
    expect(pushState(project({ lastScan: null }), EMPTY_COUNTS)).toBe('sin-escanear')
  })

  it('un score alto no desbloquea un proyecto con CRITICAL', () => {
    const optimista = project({ fortressScore: 98 })
    expect(pushState(optimista, countFindings([{ severity: 'CRITICAL' }]))).toBe('criticals')
  })

  it('sin remoto no hay nada que pushear', () => {
    expect(pushState(project({ gitRemote: null }), EMPTY_COUNTS)).toBe('sin-remote')
  })
})
