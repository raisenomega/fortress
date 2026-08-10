import { describe, expect, it } from 'vitest'
import type { Analysis } from './analysis'
import { buildOmegaPrompt } from './omega-prompt'

const ANALYSIS: Analysis = {
  target: { id: 'f1', severity: 'LOW', title: 'parentDir sin validar', file: 'src/a/b.ts', line: 15 }, // prettier-ignore
  status: 'REAL',
  whatToChange: 'validar ruta absoluta',
  where: 'src/a/b.ts',
  patternToCopy: 'isAbsoluteProjectPath',
  doNotTouch: 'la firma publica',
  risk: 'bajo',
  tokensUsed: 1
}

const INPUT = {
  analysis: ANALYSIS,
  diffText: 'diff --git a/src/a/b.ts ...',
  filesPost: [{ path: 'src/a/b.ts', content: 'post <codigo> tal cual' }],
  filesPre: [{ path: 'src/a/b.ts', content: 'pre' }]
}

describe('buildOmegaPrompt', () => {
  it('lleva analisis, diff y archivos pre/post con sus paths', () => {
    const prompt = buildOmegaPrompt(INPUT)
    expect(prompt).toContain('QUE_CAMBIAR: validar ruta absoluta')
    expect(prompt).toContain('--- PRE (base): src/a/b.ts ---')
    expect(prompt).toContain('--- POST (fix): src/a/b.ts ---')
    expect(prompt).toContain('diff --git')
    expect(prompt).toContain(':END-VERDICT')
  })

  it('sanea los campos del analisis pero NO el codigo (objeto de la revision)', () => {
    const hostil = buildOmegaPrompt({
      ...INPUT,
      analysis: { ...ANALYSIS, whatToChange: 'usa <script>`x`</script>' }
    })
    expect(hostil).not.toContain('<script>')
    expect(hostil).toContain("(script)'x'(/script)")
    expect(hostil).toContain('post <codigo> tal cual')
  })

  it('determinista: mismo input, mismo prompt', () => {
    expect(buildOmegaPrompt(INPUT)).toBe(buildOmegaPrompt(INPUT))
  })
})
