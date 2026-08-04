import { describe, expect, it } from 'vitest'
import { auditHeadline } from './audit-report'

describe('auditHeadline', () => {
  it('sin hallazgos: lo dice sin adornos', () => {
    expect(auditHeadline(0, 0)).toContain('sin hallazgos')
  })

  it('todo cuadra: no lo llama "perfecto", lo llama "cuadra"', () => {
    const h = auditHeadline(5, 0)
    expect(h).toContain('5 hallazgos')
    expect(h).toContain('cuadran')
    expect(h.toLowerCase()).not.toContain('perfecto')
  })

  it('hay discrepancias: las cuenta', () => {
    expect(auditHeadline(5, 2)).toContain('2 NO cuadran')
  })
})
