import { describe, expect, it } from 'vitest'
import { direccionALaCabeza } from './direccion-al-cto'

const F = [
  { id: 'Y', title: 'Subida anonima al bucket', file: 'x.sql', line: 39 },
  { id: 'Z', title: 'otro', file: 'a.ts', line: null }
]

describe('direccionALaCabeza: fija el QUE del CTO a la cabeza (ATERRIZAJE-3)', () => {
  it('nombra id + titulo + fichero:linea de la cabeza', () => {
    const d = direccionALaCabeza('Y', F)
    expect(d).toContain('Y')
    expect(d).toContain('Subida anonima al bucket')
    expect(d).toContain('x.sql:39')
  })

  it('cabeza null -> generico (cadena vacia)', () => {
    expect(direccionALaCabeza(null, F)).toBe('')
  })

  it('cabeza que no esta entre los vivos -> "" (no inventa)', () => {
    expect(direccionALaCabeza('NOPE', F)).toBe('')
  })

  it('line null -> fichero sin :linea', () => {
    const d = direccionALaCabeza('Z', F)
    expect(d).toContain('a.ts')
    expect(d).not.toContain('a.ts:')
  })
})
