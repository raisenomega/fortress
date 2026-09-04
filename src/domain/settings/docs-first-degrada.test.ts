import { describe, expect, it } from 'vitest'
import type { CorpusDescriptor } from '../project/corpus-descriptor'
import { buildDocsFirst } from './docs-first-compose'

const corpus = (
  docs: CorpusDescriptor['docs'],
  directories: readonly string[] = []
): CorpusDescriptor => ({ docs, directories })

const GENERALES = corpus([
  { path: 'CLAUDE.md', category: 'general' },
  { path: 'README.md', category: 'general' }
])

describe('cuando el proyecto no tiene doctrina de su clase', () => {
  it('sin documentos de su clase cae a la general, y DICE que se cayo', () => {
    // Este test afirmaba lo contrario —que la cabecera seguia prometiendo
    // seguridad— y con ello fijaba la mentira: el analista abria un README de
    // plantilla creyendo que ahi estaba escrito lo que el proyecto protege.
    const texto = buildDocsFirst('security', GENERALES)

    expect(texto).toContain('NO tiene doctrina de seguridad escrita')
    expect(texto).not.toContain('DOCS FIRST (seguridad)')
    expect(texto).toContain('CLAUDE.md, README.md')
  })

  it('lo estructural degrada igual, con su propio aviso', () => {
    expect(buildDocsFirst('structural', GENERALES)).toContain('NO tiene doctrina de arquitectura') // prettier-ignore
  })

  it('la doctrina general no degrada: ya es la suya', () => {
    expect(buildDocsFirst('general', GENERALES)).toContain('la doctrina de este proyecto esta escrita') // prettier-ignore
  })
})
