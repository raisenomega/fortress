import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS, type CorpusDescriptor } from '../project/corpus-descriptor'
import type { Analysis } from './analysis'
import { buildAnalysisPrompt } from './analysis-prompt'
import { buildGeneratorPrompt } from './generator-prompt'
import { buildOmegaPrompt } from './omega-prompt'

const CORPUS: CorpusDescriptor = {
  docs: [
    { path: 'docs/SECURITY-MODEL.md', category: 'security' },
    { path: 'docs/PRINCIPLES.md', category: 'structural' }
  ],
  directories: ['docs/DECISIONS']
}

// prettier-ignore
const TARGET = { id: 'f1', severity: 'LOW' as const, title: 't', file: 'src/a.ts', line: 1, firstSeen: '2026-01-01T00:00:00.000Z', tipo: 'path-traversal', simbolo: 'handleverify' }

const ANALYSIS: Analysis = {
  target: TARGET,
  status: 'REAL',
  whatToChange: 'w',
  where: 'src/a.ts',
  patternToCopy: 'p',
  doNotTouch: 'n',
  risk: 'r',
  tokensUsed: 1
}

const omega = (corpus: CorpusDescriptor): string =>
  buildOmegaPrompt({ analysis: ANALYSIS, corpus, diffText: 'd', filesPost: [], filesPre: [] })

describe('las tres fases del motor citan la doctrina del proyecto', () => {
  it('el analista mira lo que el proyecto escribio sobre lo que protege', () => {
    const prompt = buildAnalysisPrompt(TARGET, CORPUS, [], 'g')

    expect(prompt).toContain('DOCS FIRST (seguridad)')
    expect(prompt).toContain('docs/SECURITY-MODEL.md')
  })

  it('el generador mira lo que el proyecto dejo firmado sobre su estructura', () => {
    const prompt = buildGeneratorPrompt(ANALYSIS, CORPUS, ['src/a.ts'])

    expect(prompt).toContain('DOCS FIRST (estructural)')
    expect(prompt).toContain('docs/PRINCIPLES.md')
  })

  it('el revisor usa la categoria que su ficha de agente ya declaraba', () => {
    // sentinel-omega esta en el catalogo como agente de seguridad.
    expect(omega(CORPUS)).toContain('DOCS FIRST (seguridad)')
  })
})

describe('un proyecto sin doctrina no recibe una seccion vacia', () => {
  it('los tres prompts se construyen sin la seccion y sin romperse', () => {
    for (const prompt of [
      buildAnalysisPrompt(TARGET, EMPTY_CORPUS, [], 'g'),
      buildGeneratorPrompt(ANALYSIS, EMPTY_CORPUS, ['src/a.ts']),
      omega(EMPTY_CORPUS)
    ]) {
      expect(prompt).not.toContain('DOCS FIRST')
      expect(prompt.length).toBeGreaterThan(100)
    }
  })

  it('y el resto del prompt sigue entero: no se perdio nada por el camino', () => {
    expect(buildAnalysisPrompt(TARGET, EMPTY_CORPUS, [], 'g')).toContain('GRAFO PRIMERO')
    expect(buildGeneratorPrompt(ANALYSIS, EMPTY_CORPUS, ['src/a.ts'])).toContain('<permitidos>')
    expect(omega(EMPTY_CORPUS)).toContain('VERDICT')
  })
})
