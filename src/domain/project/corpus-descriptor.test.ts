import { describe, expect, it } from 'vitest'
import { DRAFTED_DOCS } from '../chat/config-docs'
import { CANONICAL_DOCS, CORPUS_DIRS, EMPTY_CORPUS, categoryOf } from './corpus-descriptor'

describe('categoryOf', () => {
  it('manda al modelo de amenazas solo el documento que lo es', () => {
    expect(categoryOf('SECURITY-BASELINE.md')).toBe('security')
  })

  it('manda a estructura los dos que deciden donde va un cambio', () => {
    expect(categoryOf('ARCHITECTURE.md')).toBe('structural')
    expect(categoryOf('DDD-RULES.md')).toBe('structural')
  })

  it('el resto de canonicos son doctrina general', () => {
    for (const name of ['CONSTITUTION.md', 'CLAUDE.md', 'AGENTS.md', 'PROJECT-STATE.md']) {
      expect(categoryOf(name)).toBe('general')
    }
    expect(categoryOf('README.md')).toBe('general')
  })

  it('un nombre que solo se PARECE a uno canonico no se categoriza', () => {
    // SECURITY-FIXES.md es un registro de parches. Etiquetarlo de seguridad
    // mandaria al revisor a leerlo como modelo de amenazas: asiento falso.
    expect(categoryOf('SECURITY-FIXES.md')).toBeNull()
    expect(categoryOf('ARCHITECTURE-OLD.md')).toBeNull()
    expect(categoryOf('readme.md')).toBeNull()
  })
})

describe('el catalogo de nombres', () => {
  it('los canonicos son los de la entrevista mas el README, sin copiar la lista', () => {
    expect(CANONICAL_DOCS).toEqual([...DRAFTED_DOCS, 'README.md'])
  })

  it('cada canonico tiene categoria: ninguno cae al vacio sin decidirse', () => {
    for (const name of CANONICAL_DOCS) expect(categoryOf(name)).not.toBeNull()
  })

  it('las carpetas se reconocen por nombre exacto y sin barra', () => {
    expect(CORPUS_DIRS).toEqual(['docs', 'docs-nucleo', 'doc', 'documentation'])
  })
})

describe('EMPTY_CORPUS', () => {
  it('un proyecto sin corpus no tiene nada que citar', () => {
    expect(EMPTY_CORPUS).toEqual({ docs: [], directories: [] })
  })
})
