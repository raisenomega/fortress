import { describe, expect, it } from 'vitest'
import { masUrgente, type Severity } from '../shared/severity'
import type { Fusion } from './fusion-de-duplicados'
import { severidadDeLaSuperviviente } from './severidad-al-fundir'

const GRUPO: Fusion = {
  ganadora: 'vieja',
  absorbidas: ['media', 'nueva'],
  identidad: 'src/domain/repair/allowed-files.ts|path-traversal|computeallowedfiles'
}

const mapa = (...pares: readonly [string, Severity][]): ReadonlyMap<string, Severity> =>
  new Map(pares)

const maxima = (m: ReadonlyMap<string, Severity>): Severity =>
  severidadDeLaSuperviviente(GRUPO, m, masUrgente)

describe('que severidad queda cuando dos filas eran una', () => {
  it('la MAXIMA del grupo, no la de la superviviente', () => {
    // El caso real: gana la mas antigua, que era la mas suave de las tres.
    expect(maxima(mapa(['vieja', 'MEDIUM'], ['media', 'MEDIUM'], ['nueva', 'HIGH']))).toBe('HIGH')
  })

  it('con una sola severidad en el grupo, esa misma', () => {
    expect(maxima(mapa(['vieja', 'LOW'], ['media', 'LOW'], ['nueva', 'LOW']))).toBe('LOW')
  })

  it('si la superviviente YA es la mas alta, no cambia nada', () => {
    expect(maxima(mapa(['vieja', 'CRITICAL'], ['media', 'LOW'], ['nueva', 'HIGH']))).toBe(
      'CRITICAL'
    )
  })

  it('sin severidades no inventa una: lanza, porque es un fallo de cableado', () => {
    expect(() => maxima(mapa())).toThrow('fusion sin severidades')
  })
})
