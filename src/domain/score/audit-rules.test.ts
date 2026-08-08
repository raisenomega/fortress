import { describe, expect, it } from 'vitest'
import { auditFindings } from './audit-rules'

describe('auditFindings', () => {
  it('cero vulnerabilidades = dimension limpia', () => {
    expect(auditFindings({ critical: 0, high: 0, moderate: 0, low: 0 })).toEqual([])
  })

  it('un critical -> un hallazgo CRITICAL (topa el global via el techo)', () => {
    const f = auditFindings({ critical: 1, high: 0, moderate: 0, low: 0 })
    expect(f).toHaveLength(1)
    expect(f[0].severity).toBe('CRITICAL')
  })

  it('cap a 8 por severidad para no inundar el penalty', () => {
    expect(auditFindings({ critical: 0, high: 20, moderate: 0, low: 0 })).toHaveLength(8)
  })
})
