import { describe, expect, it } from 'vitest'
import { correctnessFindings, type CorrectnessSignals } from './correctness-rules'

const CLEAN: CorrectnessSignals = {
  hasTypecheck: true,
  neuteredGate: false,
  typeErrors: 0,
  lintErrors: 0,
  buildFailed: false
}

describe('correctnessFindings', () => {
  it('limpio: sin hallazgos', () => {
    expect(correctnessFindings(CLEAN)).toEqual([])
  })

  it('verde falso: MEDIUM del gate roto + CRITICAL por 132 errores reales', () => {
    const f = correctnessFindings({ ...CLEAN, neuteredGate: true, typeErrors: 132 })
    expect(f.some((x) => x.severity === 'MEDIUM' && x.title.includes('silenciosamente roto'))).toBe(
      true
    )
    expect(f.some((x) => x.severity === 'CRITICAL' && x.title.includes('132'))).toBe(true)
  })

  it('pocos errores -> MEDIUM; build falla -> HIGH; sin typecheck -> MEDIUM', () => {
    expect(correctnessFindings({ ...CLEAN, typeErrors: 3 })[0].severity).toBe('MEDIUM')
    expect(correctnessFindings({ ...CLEAN, buildFailed: true })[0].severity).toBe('HIGH')
    const noTc = correctnessFindings({ ...CLEAN, hasTypecheck: false })
    expect(noTc.some((x) => x.title.includes('Sin script de typecheck'))).toBe(true)
  })
})
