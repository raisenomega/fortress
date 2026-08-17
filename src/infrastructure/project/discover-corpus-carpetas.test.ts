import { afterAll, describe, expect, it } from 'vitest'
import { buildScanPrompt } from '@domain/scan/scan-prompt'
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

describe('FORTRESS se reconoce a si misma con el mismo codigo que mira a los demas', () => {
  const propio = discoverCorpus(process.cwd())
  const paths = propio.docs.map((d) => d.path)

  it('encuentra en la raiz lo que tiene en la raiz', () => {
    expect(paths).toContain('CLAUDE.md')
    expect(paths).toContain('README.md')
    expect(paths).toContain('CONSTITUCION.md')
  })

  it('encuentra dentro de docs/ el corpus que ordeno alli', () => {
    expect(paths).toContain('docs/SECURITY-MODEL.md')
    expect(paths).toContain('docs/ARCHITECTURE.md')
    expect(paths).toContain('docs/PRINCIPLES.md')
  })

  it('cita la carpeta de decisiones como estructural, sin enumerar los ADRs', () => {
    expect(propio.directories).toEqual(['docs/', 'docs/DECISIONS/'])
  })

  it('categoriza cada hallazgo por su nombre, no por donde esta', () => {
    const seguridad = propio.docs.filter((d) => d.category === 'security').map((d) => d.path)
    expect(seguridad).toEqual(['docs/SECURITY-MODEL.md'])
  })
})

describe('el prompt que sale de todo esto', () => {
  it('el escaneo de FORTRESS cita su modelo de amenazas por su ruta real', () => {
    const prompt = buildScanPrompt('FORTRESS', discoverCorpus(process.cwd()))
    expect(prompt).toContain('docs/SECURITY-MODEL.md')
  })
})
