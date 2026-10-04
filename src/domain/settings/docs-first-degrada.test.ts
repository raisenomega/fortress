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

describe('cuando no se encontro doctrina de su clase', () => {
  it('sin documentos de su clase cae a la general, y DICE que se cayo', () => {
    // Este test afirmaba lo contrario —que la cabecera seguia prometiendo
    // seguridad— y con ello fijaba la mentira: el analista abria un README de
    // plantilla creyendo que ahi estaba escrito lo que el proyecto protege.
    const texto = buildDocsFirst('security', GENERALES)

    expect(texto).toContain('no encontre doctrina de seguridad escrita')
    expect(texto).not.toContain('DOCS FIRST (seguridad)')
    expect(texto).toContain('CLAUDE.md, README.md')
  })

  it('NUNCA afirma ausencia: reporta que no la hallo, y DONDE la busco', () => {
    // Un proyecto con su doctrina en otro fichero —una tabla de gaps, medido el
    // 20-sep— recibia «NO tiene doctrina». No la tenia donde se miro; nada mas.
    for (const c of ['security', 'structural'] as const) {
      const texto = buildDocsFirst(c, GENERALES)
      expect(texto).not.toMatch(/NO tiene doctrina/)
      expect(texto).toContain('en las rutas conocidas')
      expect(texto).toContain('si vive en otro sitio, dilo')
    }
    // Las rutas se DERIVAN de la tabla del corpus: las mismas que busca el descubridor.
    expect(buildDocsFirst('security', GENERALES)).toContain('SECURITY.md')
    expect(buildDocsFirst('structural', GENERALES)).toContain('ARCHITECTURE.md')
  })

  it('lo estructural degrada igual, con su propio aviso', () => {
    expect(buildDocsFirst('structural', GENERALES)).toContain('no encontre doctrina de arquitectura') // prettier-ignore
  })

  it('la doctrina general no degrada: ya es la suya', () => {
    expect(buildDocsFirst('general', GENERALES)).toContain('la doctrina de este proyecto esta escrita') // prettier-ignore
  })
})

describe('la sintaxis de file_pattern que se le enseña al agente', () => {
  const conDirs = corpus([{ path: 'README.md', category: 'general' }], ['docs/'])

  it('AVISA de que el modo query (BM25) da 0 sobre los .md aunque esten indexados', () => {
    // Backlog 2026-10-04 (3 obs): query+file_pattern dio 0 con 2636 Sections
    expect(buildDocsFirst('general', conDirs)).toMatch(/sin query: el modo query \(BM25\)/)
  })

  it('enseña la SUBCADENA, no el glob que devuelve cero', () => {
    // Medido contra el grafo vivo: '*.md' -> 0 nodos; '.md' -> 1948.
    const texto = buildDocsFirst('general', conDirs)

    expect(texto).toContain("file_pattern '.md'")
    // El glob aparece SOLO como aviso, nunca como la forma a usar.
    expect(texto).toContain("'*.md' devuelve cero")
  })

  it('AVISA de que el glob da cero y parece que no hay nada indexado', () => {
    // El fallo no protesta: responde total 0, y se lee como "no esta indexado".
    expect(buildDocsFirst('general', conDirs)).toContain('devuelve cero')
  })

  it('sin carpetas de documentacion no se menciona el grafo', () => {
    expect(buildDocsFirst('general', GENERALES)).not.toContain('file_pattern')
  })
})
