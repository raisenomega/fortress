import { describe, expect, it } from 'vitest'
import { isComplete, type Analysis, type Analyst } from '@domain/repair/analysis'
import type { Candidate, Selection } from '@domain/repair/select-target'
import { analyzeTarget } from './analyze-target'

const TARGET: Candidate = {
  id: 'l3',
  severity: 'LOW',
  title: 'postureRun sin guardRun',
  file: 'src/infrastructure/ipc/posture-handlers.ts',
  line: 11
}
const SEL: Selection = { target: TARGET, reason: 'menor superficie' }
const FULL: Analysis = {
  target: TARGET,
  whatToChange: 'a',
  where: 'b',
  patternToCopy: 'c',
  doNotTouch: 'd',
  risk: 'e',
  tokensUsed: 500
}

describe('analyzeTarget (C2 analisis)', () => {
  it('devuelve el analisis del analista SIN mutar la seleccion (no toca nada)', async () => {
    const analyst: Analyst = { study: async () => FULL }
    const before = JSON.stringify(SEL)
    const result = await analyzeTarget(analyst, SEL)
    expect(result).toBe(FULL)
    expect(JSON.stringify(SEL)).toBe(before)
  })

  it('C2 no genera fix: el analisis es inerte (sin claves de codigo/patch/diff)', () => {
    expect(Object.keys(FULL).some((k) => /patch|diff|code|edit|fix/i.test(k))).toBe(false)
  })

  it('isComplete exige TODAS las partes con contenido', () => {
    expect(isComplete(FULL)).toBe(true)
    expect(isComplete({ ...FULL, risk: '   ' })).toBe(false)
  })
})
