import { describe, expect, it } from 'vitest'
import { EMPTY_COUNTS, countFindings } from '../project/severity-counts'
import { auditSummary } from './omega-summary'

describe('auditSummary', () => {
  it('sin hallazgos: veredicto ok y lo dice sin adornos', () => {
    const r = auditSummary(EMPTY_COUNTS)
    expect(r.verdict).toBe('ok')
    expect(r.summary).toContain('sin hallazgos')
  })

  it('con hallazgos: los enumera por severidad, veredicto info', () => {
    const counts = countFindings([
      { severity: 'CRITICAL' },
      { severity: 'CRITICAL' },
      { severity: 'LOW' }
    ])
    const r = auditSummary(counts)
    expect(r.verdict).toBe('info')
    expect(r.summary).toContain('3 hallazgos')
    expect(r.summary).toContain('2 CRITICAL')
    expect(r.summary).toContain('1 LOW')
  })
})
