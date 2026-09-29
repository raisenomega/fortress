import { afterAll, describe, expect, it } from 'vitest'
import { categoryOf, categoryOfDirectory } from '@domain/project/corpus-descriptor'
import { discoverCorpus } from './discover-corpus'
import { limpiar, proyecto } from './discover-corpus-fixture'

afterAll(limpiar)

/**
 * Los nombres que un objeto literal hereda de `Object.prototype`. Buscarlos con
 * `TABLA[name] ?? null` NO devuelve nulo: devuelve lo heredado.
 *
 * Medido el 2026-09-28 sobre un repo de verdad: una carpeta `docs/toString/` del
 * proyecto auditado se citaba al agente como doctrina FIRMADA del proyecto, y un
 * `docs/constructor` se descubria con una FUNCION por categoria. Es exactamente
 * la afirmacion falsa que el corpus existe para quitar, colada por un agujero
 * del lenguaje en vez de por un nombre mal elegido.
 */
const DEL_PROTOTIPO = ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__']

describe('el corpus no hereda doctrina de Object.prototype', () => {
  it('ningun nombre del prototipo tiene categoria', () => {
    for (const name of DEL_PROTOTIPO) {
      expect(categoryOf(name)).toBeNull()
      expect(categoryOfDirectory(name)).toBeNull()
    }
  })

  it('los nombres canonicos de verdad siguen entrando', () => {
    expect(categoryOf('ARCHITECTURE.md')).toBe('structural')
    expect(categoryOf('SECURITY.md')).toBe('security')
    expect(categoryOf('README.md')).toBe('general')
    expect(categoryOfDirectory('DECISIONS')).toBe('structural')
  })

  it('lo que se llama como el prototipo no se cita como doctrina', () => {
    const dir = proyecto(
      'prototipo',
      ['docs/constructor', 'docs/ARCHITECTURE.md'],
      ['docs', 'docs/toString']
    )
    const corpus = discoverCorpus(dir)

    expect(corpus.directories).toEqual(['docs/'])
    expect(corpus.docs).toEqual([{ path: 'docs/ARCHITECTURE.md', category: 'structural' }])
  })
})
