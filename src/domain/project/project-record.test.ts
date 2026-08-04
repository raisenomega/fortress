import { describe, expect, it } from 'vitest'
import type { ScanRecord } from '../scan/scan-record'
import { buildProjectRecord } from './project-record'
import type { Finding, Project } from './project'

const project = {
  name: 'Nucleo',
  path: '/x',
  fortressScore: 72,
  lastScan: '2026-08-04T10:00:00Z'
} as Project

const scan = { id: 's1', projectId: 'p', score: 72 } as ScanRecord
const open: Finding = { id: 'f1', severity: 'HIGH', title: 'Fuga', file: 'src/a.ts', line: 9, status: 'open' }
const descartado: Finding = { ...open, id: 'f2', title: 'Falso', status: 'false_positive' }

describe('buildProjectRecord', () => {
  it('resume score, escaneos y hallazgos ABIERTOS (no los descartados)', () => {
    const md = buildProjectRecord(project, [open, descartado], [scan], '2026-08-04T12:00:00Z')
    expect(md).toContain('Score FORTRESS: 72/100')
    expect(md).toContain('Escaneos registrados: 1')
    expect(md).toContain('Hallazgos abiertos: 1')
    expect(md).toContain('src/a.ts:9 — Fuga')
    expect(md).not.toContain('Falso') // el descartado no va
  })

  it('un proyecto limpio lo dice', () => {
    expect(buildProjectRecord(project, [], [], '2026-08-04T12:00:00Z')).toContain('quedo limpio')
  })
})
