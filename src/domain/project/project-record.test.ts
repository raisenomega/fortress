import { describe, expect, it } from 'vitest'
import type { Proposal } from '../repair/proposal'
import type { ScanRecord } from '../scan/scan-record'
import { buildProjectRecord } from './project-record'
import type { Finding, Project } from './project'

const propuesta = (id: string, state: Proposal['state']): Proposal =>
  ({ id, projectId: 'p', findingId: 'f1abcdef', state }) as Proposal

const project = {
  name: 'Nucleo',
  path: '/x',
  fortressScore: 72,
  lastScan: '2026-08-04T10:00:00Z'
} as Project

const scan = { id: 's1', projectId: 'p', score: 72 } as ScanRecord
const AT = '2026-08-04T12:00:00Z'
const open: Finding = {
  id: 'f1',
  severity: 'HIGH',
  title: 'Fuga',
  file: 'src/a.ts',
  line: 9,
  status: 'open',
  lifecycle: 'ACTIVE' as const,
  mitigatedNote: null,
  lastSeen: ''
}
const descartado: Finding = {
  ...open,
  id: 'f2',
  title: 'Falso',
  status: 'false_positive',
  lifecycle: 'ACTIVE' as const,
  mitigatedNote: null,
  lastSeen: ''
}

describe('buildProjectRecord', () => {
  it('resume score, escaneos y hallazgos ABIERTOS (no los descartados)', () => {
    const md = buildProjectRecord(project, [open, descartado], [scan], [], AT)
    expect(md).toContain('Score FORTRESS: 72/100')
    expect(md).toContain('Escaneos registrados: 1')
    expect(md).toContain('Hallazgos abiertos: 1')
    expect(md).toContain('src/a.ts:9 — Fuga')
    expect(md).not.toContain('Falso') // el descartado no va
  })

  it('un proyecto limpio lo dice', () => {
    expect(buildProjectRecord(project, [], [], [], AT)).toContain('quedo limpio')
  })

  it('lista las propuestas VIVAS, y las terminales solo cuentan', () => {
    const vivas = [propuesta('aaaaaaaa-1', 'ANALIZADO'), propuesta('bbbbbbbb-2', 'MERGEADO')]
    const md = buildProjectRecord(project, [], [], vivas, AT)

    expect(md).toContain('Propuestas de reparacion: 2 (1 vivas al retirarlo)')
    expect(md).toContain('aaaaaaaa — ANALIZADO, sobre el hallazgo f1abcdef')
    expect(md).not.toContain('bbbbbbbb') // la terminal no se enumera
  })

  it('sin propuestas vivas no abre la seccion', () => {
    const md = buildProjectRecord(project, [], [], [propuesta('cccccccc-3', 'CADUCADO')], AT)

    expect(md).toContain('Propuestas de reparacion: 1 (0 vivas al retirarlo)')
    expect(md).not.toContain('## Propuestas vivas')
  })
})
