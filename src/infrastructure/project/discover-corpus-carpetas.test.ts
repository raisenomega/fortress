import { afterAll, describe, expect, it } from 'vitest'
import { discoverCorpus } from './discover-corpus'
import { limpiar, proyecto } from './discover-corpus-fixture'

afterAll(limpiar)

const rutas = (dir: string): readonly string[] => discoverCorpus(dir).docs.map((d) => d.path)

describe('discoverCorpus: un nivel dentro de la carpeta de documentacion', () => {
  it('reconoce el modelo de amenazas y la arquitectura donde de verdad viven', () => {
    // El orden lo pone el sistema de ficheros, asi que no se fija aqui.
    const dir = proyecto('ordenado', ['docs/SECURITY-MODEL.md', 'docs/ARCHITECTURE.md'], ['docs'])
    const docs = discoverCorpus(dir).docs
    expect(docs).toHaveLength(2)
    expect(docs).toContainEqual({ path: 'docs/SECURITY-MODEL.md', category: 'security' })
    expect(docs).toContainEqual({ path: 'docs/ARCHITECTURE.md', category: 'structural' })
  })

  it('lo que no es canonico dentro de la carpeta se queda fuera', () => {
    const dir = proyecto('con-ruido', ['docs/GUIA.md', 'docs/OTRA.md'], ['docs'])
    expect(discoverCorpus(dir)).toEqual({ docs: [], directories: ['docs/'] })
  })

  it('una subcarpeta canonica se cita; una cualquiera no', () => {
    const dir = proyecto('con-decisiones', [], ['docs', 'docs/DECISIONS', 'docs/PAGES'])
    expect(discoverCorpus(dir).directories).toEqual(['docs/', 'docs/DECISIONS/'])
  })

  it('no baja un segundo nivel: lo que este mas hondo no se descubre', () => {
    const dir = proyecto('hondo', ['docs/FLOWS/POSTURE.md'], ['docs', 'docs/FLOWS'])
    expect(rutas(dir)).toEqual([])
  })

  it('la carpeta con otro nombre se barre igual que docs/', () => {
    const dir = proyecto('nucleo', ['docs-nucleo/PRINCIPLES.md'], ['docs-nucleo'])
    expect(discoverCorpus(dir).docs).toEqual([
      { path: 'docs-nucleo/PRINCIPLES.md', category: 'structural' }
    ])
  })
})

describe('el corpus de la raiz se descubre entero, este o no versionado', () => {
  // Sobre un proyecto CONTROLADO y no sobre el repo: `CLAUDE.md` y
  // `CONSTITUCION.md` son documentos internos y estan en .gitignore, asi que en
  // el disco del repo principal existen y en cualquier worktree limpio no. Con
  // `process.cwd()` este caso no media el descubridor sino la configuracion del
  // disco: fallaba siempre en el worktree del motor, que es donde corre el gate
  // de una auto-reparacion, y ese rojo permanente enmascaraba roturas reales.
  const dir = proyecto('raiz-completa', ['CLAUDE.md', 'README.md', 'CONSTITUCION.md'])

  it('encuentra en la raiz lo que tiene en la raiz', () => {
    expect(rutas(dir)).toEqual(
      expect.arrayContaining(['CLAUDE.md', 'README.md', 'CONSTITUCION.md'])
    )
  })
})
