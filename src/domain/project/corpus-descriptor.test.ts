import { describe, expect, it } from 'vitest'
import { DRAFTED_DOCS } from '../chat/config-docs'
import {
  CANONICAL_DOCS,
  CORPUS_DIRS,
  EMPTY_CORPUS,
  categoryOf,
  categoryOfDirectory
} from './corpus-descriptor'

describe('categoryOf', () => {
  it('manda al modelo de amenazas los dos documentos que lo son', () => {
    expect(categoryOf('SECURITY-BASELINE.md')).toBe('security')
    expect(categoryOf('SECURITY-MODEL.md')).toBe('security')
  })

  it('manda a estructura los que deciden donde va un cambio', () => {
    for (const name of ['ARCHITECTURE.md', 'DDD-RULES.md', 'PRINCIPLES.md']) {
      expect(categoryOf(name)).toBe('structural')
    }
  })

  it('el resto de canonicos son doctrina general, en sus dos idiomas', () => {
    for (const name of ['CONSTITUTION.md', 'CONSTITUCION.md', 'CLAUDE.md', 'README.md']) {
      expect(categoryOf(name)).toBe('general')
    }
    expect(categoryOf('AGENTS.md')).toBe('general')
    expect(categoryOf('PROJECT-STATE.md')).toBe('general')
  })

  it('un nombre que solo se PARECE a uno canonico no se categoriza', () => {
    // SECURITY-FIXES.md es un registro de parches. Etiquetarlo de seguridad
    // mandaria al revisor a leerlo como modelo de amenazas: asiento falso.
    expect(categoryOf('SECURITY-FIXES.md')).toBeNull()
    expect(categoryOf('ARCHITECTURE-OLD.md')).toBeNull()
    expect(categoryOf('readme.md')).toBeNull()
  })
})

describe('categoryOfDirectory', () => {
  it('una carpeta cuyo nombre ya dice lo que guarda se categoriza', () => {
    expect(categoryOfDirectory('DECISIONS')).toBe('structural')
  })

  it('las carpetas contenedoras no dicen nada por si mismas', () => {
    for (const name of ['docs', 'doc', 'PAGES', 'FLOWS']) {
      expect(categoryOfDirectory(name)).toBeNull()
    }
  })
})

describe('el catalogo de nombres', () => {
  it('todo lo que redacta la entrevista de configuracion es descubrible', () => {
    for (const doc of DRAFTED_DOCS) expect(categoryOf(doc)).not.toBeNull()
  })

  it('cada canonico buscado tiene categoria: ninguno cae al vacio sin decidirse', () => {
    for (const name of CANONICAL_DOCS) expect(categoryOf(name)).not.toBeNull()
  })

  it('las carpetas de documentacion se reconocen por nombre exacto y sin barra', () => {
    expect(CORPUS_DIRS).toEqual(['docs', 'docs-nucleo', 'doc', 'documentation'])
  })
})

describe('EMPTY_CORPUS', () => {
  it('un proyecto sin corpus no tiene nada que citar', () => {
    expect(EMPTY_CORPUS).toEqual({ docs: [], directories: [] })
  })
})
