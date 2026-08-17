import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { dirname, join } from 'path'
import { afterAll, describe, expect, it } from 'vitest'
import { discoverCorpus } from './discover-corpus'

const raiz = mkdtempSync(join(tmpdir(), 'fortress-corpus-'))
afterAll(() => rmSync(raiz, { recursive: true, force: true }))

/** Un proyecto de prueba con exactamente los ficheros y carpetas que se le pidan. */
function proyecto(nombre: string, docs: readonly string[], dirs: readonly string[] = []): string {
  const dir = join(raiz, nombre)
  mkdirSync(dir, { recursive: true })
  for (const doc of docs) {
    mkdirSync(dirname(join(dir, doc)), { recursive: true })
    writeFileSync(join(dir, doc), '# contenido')
  }
  for (const carpeta of dirs) mkdirSync(join(dir, carpeta), { recursive: true })
  return dir
}

const rutas = (dir: string): readonly string[] => discoverCorpus(dir).docs.map((d) => d.path)

describe('discoverCorpus: solo entra lo que existe', () => {
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

  it('cita la carpeta y NO enumera lo que hay dentro', () => {
    const dir = proyecto('solo-docs', ['docs/GUIA.md', 'docs/OTRA.md'], ['docs'])
    expect(discoverCorpus(dir)).toEqual({ docs: [], directories: ['docs/'] })
  })

  it('categoriza los canonicos y descarta lo que solo se les parece', () => {
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

  it('FORTRESS se reconoce con el mismo codigo que mira a los demas', () => {
    expect(discoverCorpus(process.cwd()).directories).toContain('docs/')
    expect(rutas(process.cwd())).toContain('CLAUDE.md')
  })
})
