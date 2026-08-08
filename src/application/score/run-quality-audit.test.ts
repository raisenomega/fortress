import { describe, expect, it } from 'vitest'
import type { IntegrityReport } from '@domain/probe/integrity'
import type { Finding } from '@domain/project/project'
import type { IntegralScore } from '@domain/score/integral-score'
import type { QualityAudit, QualityAuditor } from '@domain/score/quality-auditor'
import type { AppContext } from '../context'
import { runQualityAudit } from './run-quality-audit'

const OPEN: Finding = { id: 'f1', severity: 'MEDIUM', status: 'open' } as unknown as Finding
const DISMISSED: Finding = { id: 'f2', severity: 'CRITICAL', status: 'false_positive' } as Finding
const SCORE: IntegralScore = { global: 94, partial: false, missing: [], byDimension: [] }
const CLEAN: IntegrityReport = { clean: true, violations: [] }

interface Saved {
  global?: number
  recorded?: number
  contaminatedWith?: string
}

function fakeContext(saved: Saved): AppContext {
  return {
    projects: {
      findById: () => ({ id: 'p1', path: '/repo', trusted: true }),
      setQuality: (_id: string, global: number): void => {
        saved.global = global
      },
      markContaminated: (_id: string, detail: string): void => {
        saved.contaminatedWith = detail
      }
    },
    findings: { listByProject: (): readonly Finding[] => [OPEN, DISMISSED] },
    qualityHistory: {
      record: (_id: string, global: number): void => {
        saved.recorded = global
      }
    }
  } as unknown as AppContext
}

const auditorWith = (
  integrity: IntegrityReport,
  inputs: QualityAudit['inputs'] = {}
): QualityAuditor => ({
  audit: async () => ({ score: SCORE, inputs, integrity })
})

describe('runQualityAudit', () => {
  it('audit limpio -> persiste el score', async () => {
    const saved: Saved = {}
    const result = await runQualityAudit(fakeContext(saved), auditorWith(CLEAN), 'p1')
    expect(result.ok && result.value.global).toBe(94)
    expect(saved.global).toBe(94)
    expect(saved.recorded).toBe(94) // punto de tendencia registrado
    expect(saved.contaminatedWith).toBeUndefined()
  })

  it('CAPA 4: si la integridad falla -> marca CONTAMINADO, NO persiste, devuelve error', async () => {
    const saved: Saved = {}
    const dirty: IntegrityReport = {
      clean: false,
      violations: [{ path: 'src/a.ts', kind: 'modified', before: 'aaaa', after: 'bbbb' }]
    }
    const result = await runQualityAudit(fakeContext(saved), auditorWith(dirty), 'p1')
    expect(result.ok).toBe(false)
    expect(saved.global).toBeUndefined() // NO se persistio el score
    expect(saved.contaminatedWith).toContain('src/a.ts') // forense
  })

  it('proyecto inexistente -> error, sin auditar', async () => {
    const context = { projects: { findById: (): null => null } } as unknown as AppContext
    const result = await runQualityAudit(context, auditorWith(CLEAN), 'nope')
    expect(result.ok).toBe(false)
  })
})
