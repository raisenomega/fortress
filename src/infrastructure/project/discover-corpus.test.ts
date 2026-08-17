import { writeFileSync } from 'fs'
import { join } from 'path'
import { afterAll, describe, expect, it } from 'vitest'
import { discoverCorpus } from './discover-corpus'
import { limpiar, proyecto, raiz } from './discover-corpus-fixture'

afterAll(limpiar)

const rutas = (dir: string): readonly string[] => discoverCorpus(dir).docs.map((d) => d.path)

describe('discoverCorpus: la raiz del proyecto', () => {
  it('un proyecto sin nada no tiene corpus que citar', () => {
    expect(discoverCorpus(proyecto('vacio', []))).toEqual({ docs: [], directories: [] })
  })

  it('una ruta que no existe tampoco', () => {
    expect(discoverCorpus(join(raiz, 'no-existe'))).toEqual({ docs: [], directories: [] })
  })

  it('reconoce el canonico de raiz con su categoria', () => {
    expect(discoverCorpus(proyecto('solo-readme', ['README.md'])).docs).toEqual([
      { path: 'README.md', category: 'general' }
    ])
  })

  it('reconoce los nombres de un corpus escrito antes de conocer FORTRESS', () => {
    const dir = proyecto('a-mano', ['CONSTITUCION.md', 'PRINCIPLES.md', 'SECURITY-MODEL.md'])
    expect(discoverCorpus(dir).docs).toEqual([
      { path: 'SECURITY-MODEL.md', category: 'security' },
      { path: 'PRINCIPLES.md', category: 'structural' },
      { path: 'CONSTITUCION.md', category: 'general' }
    ])
  })

  it('descarta lo que solo se parece a un canonico', () => {
    const dir = proyecto('mezcla', ['CLAUDE.md', 'SECURITY-FIXES.md'], ['docs-nucleo'])
    expect(rutas(dir)).toEqual(['CLAUDE.md'])
    expect(discoverCorpus(dir).directories).toEqual(['docs-nucleo/'])
  })
})

describe('discoverCorpus: la declaracion del proyecto', () => {
  it('sustituye entera a lo descubierto', () => {
    const dir = proyecto('declarado', ['README.md', '.fortress/config'], ['docs'])
    const decl = '{ "corpus": { "docs": ["wiki/NORMAS.md"], "directories": ["wiki/"] } }'
    writeFileSync(join(dir, '.fortress', 'config'), decl)
    expect(discoverCorpus(dir)).toEqual({
      docs: [{ path: 'wiki/NORMAS.md', category: 'general' }],
      directories: ['wiki/']
    })
  })

  it('si es ilegible no inventa nada: se cae a lo descubierto', () => {
    const dir = proyecto('roto', ['README.md', '.fortress/config'])
    writeFileSync(join(dir, '.fortress', 'config'), '{ "corpus": 42 }')
    expect(rutas(dir)).toEqual(['README.md'])
  })
})
