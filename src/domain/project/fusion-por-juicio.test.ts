import { describe, expect, it } from 'vitest'
import type { FilaAFusionar } from './fusion-de-duplicados'
import { fusionPorJuicio, idsAdmitidos } from './fusion-por-juicio'

const fila = (id: string, identidad: string, firstSeen: string): FilaAFusionar => ({ id, identidad, firstSeen }) // prettier-ignore

describe('fusionPorJuicio: claves distintas que un agente declaro el mismo defecto', () => {
  it('la mas antigua sobrevive y su clave es la del grupo; las otras se absorben', () => {
    expect(fusionPorJuicio([fila('b', 'a.ts|20|x', '2026-09-05'), fila('a', 'a.ts|10|x', '2026-09-01')])).toEqual({ ganadora: 'a', absorbidas: ['b'], identidad: 'a.ts|10|x' }) // prettier-ignore
  })

  it('con una sola fila no hay nada que fundir', () => {
    expect(fusionPorJuicio([fila('a', 'a.ts|10|x', '2026-09-01')])).toBeNull()
  })
})

describe('idsAdmitidos: el analista solo puede nombrar a los citados (fail-closed)', () => {
  it('un id fuera de los citados se ignora; los repetidos, una vez', () => {
    expect(idsAdmitidos(['ajeno', 'a', 'a', 'b'], ['a', 'b'])).toEqual(['a', 'b'])
    expect(idsAdmitidos(['ajeno'], ['a'])).toEqual([])
  })

  it('sin respuesta o sin cita no se admite nada', () => {
    expect(idsAdmitidos(undefined, ['a'])).toEqual([])
    expect(idsAdmitidos(['a'], undefined)).toEqual([])
  })
})
