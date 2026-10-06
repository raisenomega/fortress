import { describe, expect, it } from 'vitest'
import { isAncestor } from './is-ancestor'

/**
 * El sesgo seguro es la razon de ser de este helper: ante cualquier duda
 * responde false, porque un false CADUCA una propuesta y un true la da por
 * mergeada. Equivocarse hacia false es recuperable; hacia true, no.
 */
describe('isAncestor: sesgo seguro', () => {
  it('un directorio que no es repo devuelve false, no lanza', () => {
    expect(isAncestor('/no/existe/este/repo', 'c0ffee')).toBe(false)
  })

  it('un commit desconocido en un repo real devuelve false', () => {
    expect(isAncestor(process.cwd(), '0000000000000000000000000000000000000000')).toBe(false)
  })

  it('HEAD siempre es ancestro de si mismo', () => {
    expect(isAncestor(process.cwd(), 'HEAD')).toBe(true)
  })
})

describe('isAncestor: lista blanca de entorno', () => {
  it('un GIT_DIR heredado del operador no desvia merge-base a otro repo', () => {
    const previo = process.env.GIT_DIR
    process.env.GIT_DIR = '/no/existe/otro/repo/.git'
    try {
      expect(isAncestor(process.cwd(), 'HEAD')).toBe(true)
    } finally {
      if (previo === undefined) delete process.env.GIT_DIR
      else process.env.GIT_DIR = previo
    }
  })
})
