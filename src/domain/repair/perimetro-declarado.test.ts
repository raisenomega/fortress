import { describe, expect, it } from 'vitest'
import { allowsFor, checkScope } from './scope-check'
import type { ScopeGroup } from './scope-groups'

const ANCLA = 'supabase/migrations/20260102_policy.sql'

/** El caso real: una policy se arregla creando una migracion nueva, y el fix
 *  cruza a la capa que sube la imagen. */
const SUPABASE: ScopeGroup = {
  name: 'supabase-policy',
  when: 'supabase/migrations/**',
  allow: ['supabase/migrations/**', 'src/components/**']
}

const correa = ['supabase/migrations/20260102_policy.sql']
const permiteA = (file: string, ancla: string, groups: readonly ScopeGroup[]): boolean =>
  checkScope([file], correa, allowsFor(ancla, groups)).ok

describe('el proyecto declara el terreno de un fix', () => {
  it('el fix del bucket puede CREAR la migracion nueva que necesitaba', () => {
    // Un archivo que aun no existe es "tocar algo dentro del terreno abierto".
    expect(permiteA('supabase/migrations/20260804_limit.sql', ANCLA, [SUPABASE])).toBe(true)
  })

  it('y puede cruzar a la capa que el proyecto declaro con el', () => {
    expect(permiteA('src/components/PreOrderForm.tsx', ANCLA, [SUPABASE])).toBe(true)
  })

  it('lo que nadie declaro sigue fuera', () => {
    expect(permiteA('src/lib/otra-cosa.ts', ANCLA, [SUPABASE])).toBe(false)
  })

  it('el permiso es DIRIGIDO: el cliente no hereda la base', () => {
    // Un hallazgo en un componente no puede reescribir migraciones solo porque
    // el proyecto abriera ese camino en el otro sentido.
    const desdeCliente = 'src/components/PreOrderForm.tsx'
    expect(permiteA('supabase/migrations/x.sql', desdeCliente, [SUPABASE])).toBe(false)
  })

  it('dos grupos que casan el mismo ancla suman sus terrenos', () => {
    const otro: ScopeGroup = { name: 'docs', when: 'supabase/**', allow: ['docs/**'] }
    expect(allowsFor(ANCLA, [SUPABASE, otro])).toEqual([
      'supabase/migrations/**',
      'src/components/**',
      'docs/**'
    ])
  })
})
