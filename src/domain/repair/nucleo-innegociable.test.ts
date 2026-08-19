import { describe, expect, it } from 'vitest'
import { allowsFor, checkScope } from './scope-check'
import { parseScopeGroups, type ScopeGroup } from './scope-groups'

const ANCLA = 'supabase/migrations/20260102_policy.sql'
const correa = ['supabase/migrations/20260102_policy.sql']

const permiteA = (file: string, ancla: string, groups: readonly ScopeGroup[]): boolean =>
  checkScope([file], correa, allowsFor(ancla, groups)).ok

describe('el nucleo innegociable recorta cualquier declaracion', () => {
  const abierto = (allow: readonly string[]): ScopeGroup => ({ name: 'x', when: '**', allow })

  it('un grupo que se declare las reglas NO puede reescribirlas', () => {
    expect(permiteA('.fortress/config', ANCLA, [abierto(['.fortress/**'])])).toBe(false)
  })

  it('ni con un comodin que lo abarque todo', () => {
    expect(permiteA('.fortress/config', ANCLA, [abierto(['**'])])).toBe(false)
    expect(permiteA('.git/hooks/post-commit', ANCLA, [abierto(['**'])])).toBe(false)
  })

  it('nada fuera del arbol del proyecto, se declare como se declare', () => {
    for (const fuera of ['../otro/x.ts', '/etc/passwd', 'src/../../x.ts']) {
      expect(permiteA(fuera, ANCLA, [abierto(['**', '../**'])])).toBe(false)
    }
  })
})

describe('un proyecto que no declara nada se comporta como siempre', () => {
  it('sin grupos manda la correa universal', () => {
    expect(checkScope(['src/a.ts'], ['src/a.ts'], []).ok).toBe(true)
    expect(checkScope(['src/b.ts'], ['src/a.ts'], []).ok).toBe(false)
  })

  it('un config ilegible no ensancha nada: se queda sin grupos', () => {
    expect(parseScopeGroups({ scope: { groups: 'no es lista' } })).toEqual([])
    expect(parseScopeGroups({ scope: { groups: [{ name: 'x' }] } })).toEqual([])
    expect(parseScopeGroups(null)).toEqual([])
  })

  it('un grupo mal escrito invalida la lista entera, no solo su entrada', () => {
    const bueno = { name: 'a', when: 'x/**', allow: ['y/**'] }
    const medio = { scope: { groups: [bueno, { name: 'b' }] } }
    expect(parseScopeGroups(medio)).toEqual([])
  })
})
