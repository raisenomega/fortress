import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import { CON_BASH } from '../agent/capacidades-fixture'
import { buildAnalysisPrompt } from './analysis-prompt'

// prettier-ignore
const TARGET = { id: 'f1', severity: 'LOW' as const, title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: null, simbolo: null }
const BARRERAS = ['Barreras que este proyecto declara (1 hooks PreToolUse; .fortress/config presente):', '- Bash -> vigilar.sh (sh: arranca)'] // prettier-ignore

describe('el prompt del analista lleva las barreras declaradas (ADR-104 §3)', () => {
  it('con barreras en el candidato, el bloque entra', () => {
    const p = buildAnalysisPrompt(
      { ...TARGET, barreras: BARRERAS },
      EMPTY_CORPUS,
      [],
      'g',
      CON_BASH
    )
    expect(p).toContain('Barreras que este proyecto declara')
    expect(p).toContain('- Bash -> vigilar.sh (sh: arranca)')
  })

  it('sin barreras, o con la lista vacia, el prompt es el de ayer', () => {
    const base = buildAnalysisPrompt(TARGET, EMPTY_CORPUS, [], 'g', CON_BASH)
    expect(base).not.toContain('Barreras que este proyecto declara')
    expect(buildAnalysisPrompt({ ...TARGET, barreras: [] }, EMPTY_CORPUS, [], 'g', CON_BASH)).toBe(base) // prettier-ignore
  })
})
