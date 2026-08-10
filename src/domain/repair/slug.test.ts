import { describe, expect, it } from 'vitest'
import { toSlug } from './slug'

describe('toSlug (D8)', () => {
  it('minusculas y sin diacriticos', () => {
    expect(toSlug('Validación de parentDir')).toBe('validacion-de-parentdir')
  })

  it('no-alfanumericos a guion, colapsados', () => {
    expect(toSlug('mkdir  arbitrario // y fuga!!')).toBe('mkdir-arbitrario-y-fuga')
  })

  it('trunca a 30 sin dejar guion colgando', () => {
    const slug = toSlug('parentDir sin validar permite mkdir arbitrario y fuga de listado')
    expect(slug.length).toBeLessThanOrEqual(30)
    expect(slug.endsWith('-')).toBe(false)
    expect(slug).toBe('parentdir-sin-validar-permite')
  })

  it('bordes limpios y determinismo', () => {
    expect(toSlug('  ---Ñandú---  ')).toBe('nandu')
    expect(toSlug('  ---Ñandú---  ')).toBe(toSlug('---ñandu---'))
  })

  it('vacio queda vacio, sin reventar', () => {
    expect(toSlug('')).toBe('')
    expect(toSlug('***')).toBe('')
  })
})
