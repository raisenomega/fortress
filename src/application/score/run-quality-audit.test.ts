import { describe, expect, it } from 'vitest'
import type { Finding } from '@domain/project/project'
import type { DimensionScores } from '@domain/score/dimension'
import type { QualityAuditor } from '@domain/score/quality-auditor'
import type { HasSeverity } from '@domain/shared/severity'
import type { AppContext } from '../context'
import { runQualityAudit } from './run-quality-audit'

const OPEN: Finding = { id: 'f1', severity: 'MEDIUM', status: 'open' } as unknown as Finding
const DISMISSED: Finding = { id: 'f2', severity: 'CRITICAL', status: 'false_positive' } as Finding

function fakeContext(saved: {
  dims?: DimensionScores
  global?: number
  partial?: boolean
}): AppContext {
  return {
    projects: {
      findById: (): { id: string; path: string; trusted: boolean } => ({
        id: 'p1',
        path: '/repo',
        trusted: true
      }),
      setQuality: (_id: string, global: number, dims: DimensionScores, partial: boolean): void => {
        saved.global = global
        saved.dims = dims
        saved.partial = partial
      }
    },
    findings: { listByProject: (): readonly Finding[] => [OPEN, DISMISSED] }
  } as unknown as AppContext
}

describe('runQualityAudit', () => {
  it('pasa SOLO los hallazgos abiertos como Seguridad y persiste el score', async () => {
    let seenSecurity: readonly HasSeverity[] | null = null
    const auditor: QualityAuditor = {
      audit: async (_p, _t, security) => {
        seenSecurity = security
        return {
          score: {
            global: 94,
            partial: false,
            missing: [],
            byDimension: [{ key: 'seguridad', label: 'Seguridad', weight: 30, score: 86, count: 1 }]
          },
          inputs: {}
        }
      }
    }
    const saved: { dims?: DimensionScores; global?: number; partial?: boolean } = {}

    const result = await runQualityAudit(fakeContext(saved), auditor, 'p1')

    expect(result.ok && result.value.global).toBe(94)
    expect(seenSecurity).toEqual([OPEN]) // el descartado NO viaja
    expect(saved.global).toBe(94)
    expect(saved.dims?.seguridad).toBe(86)
  })

  it('proyecto inexistente -> error, sin auditar', async () => {
    const context = { projects: { findById: (): null => null } } as unknown as AppContext
    const auditor: QualityAuditor = {
      audit: async () => {
        throw new Error('no deberia correr')
      }
    }
    const result = await runQualityAudit(context, auditor, 'nope')
    expect(result.ok).toBe(false)
  })
})
