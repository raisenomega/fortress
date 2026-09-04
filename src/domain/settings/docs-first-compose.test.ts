import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS, type CorpusDescriptor } from '../project/corpus-descriptor'
import { buildDocsFirst } from './docs-first-compose'

const corpus = (
  docs: CorpusDescriptor['docs'],
  directories: readonly string[] = []
): CorpusDescriptor => ({ docs, directories })

const GENERALES = corpus([
  { path: 'CLAUDE.md', category: 'general' },
  { path: 'README.md', category: 'general' }
])

describe('buildDocsFirst', () => {
  it('sin corpus no dice nada: quien lo reciba omite el bloque', () => {
    expect(buildDocsFirst('general', EMPTY_CORPUS)).toBe('')
    expect(buildDocsFirst('security', EMPTY_CORPUS)).toBe('')
    expect(buildDocsFirst('structural', EMPTY_CORPUS)).toBe('')
  })

  it('cita los documentos que existen, y solo esos', () => {
    const texto = buildDocsFirst('general', GENERALES)
    expect(texto).toContain('CLAUDE.md, README.md')
    expect(texto).toContain('DOCS FIRST:')
    // Sin carpetas no hay nada que pedirle al grafo por patron.
    expect(texto).not.toContain('file_pattern')
  })

  it('un proyecto con solo una carpeta se queda con la carpeta', () => {
    const texto = buildDocsFirst('general', corpus([], ['docs/']))
    expect(texto).toContain('docs/.')
    expect(texto).toContain('file_pattern')
  })
})

describe('buildDocsFirst: segun la decision que toque', () => {
  it('al revisor de seguridad le nombra el modelo de amenazas primero', () => {
    const conModelo = corpus(
      [
        { path: 'CLAUDE.md', category: 'general' },
        { path: 'docs/SECURITY-MODEL.md', category: 'security' }
      ],
      ['docs/']
    )
    const texto = buildDocsFirst('security', conModelo)
    expect(texto).toContain('DOCS FIRST (seguridad)')
    expect(texto).toContain('docs/SECURITY-MODEL.md, docs/')
    expect(texto).not.toContain('CLAUDE.md')
    expect(texto).toContain('file_pattern')
  })

  it('a quien decide estructura le pone delante la carpeta de decisiones', () => {
    const conDecisiones = corpus(
      [{ path: 'docs/ARCHITECTURE.md', category: 'structural' }],
      ['docs/', 'docs/DECISIONS/']
    )
    const texto = buildDocsFirst('structural', conDecisiones)
    expect(texto).toContain('DOCS FIRST (estructural)')
    expect(texto).toContain('docs/ARCHITECTURE.md, docs/DECISIONS/, docs/')
  })
})
