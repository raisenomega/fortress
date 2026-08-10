import { describe, expect, it } from 'vitest'
import { checkScope } from './scope-check'

const ALLOWED = ['src/a/b.ts', 'src/a/b.test.ts', 'src/a/b.spec.ts']

describe('checkScope', () => {
  it('todo dentro del scope pasa', () => {
    expect(checkScope(['src/a/b.ts', 'src/a/b.test.ts'], ALLOWED)).toEqual({
      ok: true,
      violations: []
    })
  })

  it('un archivo fuera del scope es violacion, con nombre y apellido', () => {
    const result = checkScope(['src/a/b.ts', 'src/otra/cosa.ts'], ALLOWED)
    expect(result.ok).toBe(false)
    expect(result.violations).toEqual(['src/otra/cosa.ts'])
  })

  it('sin cambios no hay violaciones', () => {
    expect(checkScope([], ALLOWED).ok).toBe(true)
  })

  it('con allowed vacio, TODO es violacion', () => {
    expect(checkScope(['src/a/b.ts'], []).violations).toEqual(['src/a/b.ts'])
  })
})
