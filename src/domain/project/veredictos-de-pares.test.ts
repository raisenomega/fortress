import { describe, expect, it } from 'vitest'
import { fusionesDelLote, veredictosDePares, type VeredictoDePar } from './veredictos-de-pares'
import type { FilaDelPar, Par } from './pares-candidatos'

// prettier-ignore
const f = (id: string, firstSeen: string, line = 10): FilaDelPar => ({ id, file: 'f.ts', line, tipo: 'x', simbolo: 's', title: `t-${id}`, identity: `f.ts|${line}|x`, firstSeen, severity: 'LOW' })
const par = (a: ReturnType<typeof f>, b: ReturnType<typeof f>): Par => ({
  id: `${a.id}+${b.id}`,
  a,
  b
})
const AB = par(f('a', '2026-09-01'), f('b', '2026-09-05', 20)),
  BC = par(f('b', '2026-09-05', 20), f('c', '2026-09-09', 30))

describe('veredictosDePares: MISMO funde, DISTINTOS deja, y lo demas no decide (fail-closed)', () => {
  it('MISMO y DISTINTOS se leen; sin respuesta o ilegible, sin decidir, que no funde', () => {
    const v = veredictosDePares([AB, BC, par(f('c', '2026-09-09', 30), f('d', '2026-09-10', 40))], [{ par: 'a+b', veredicto: 'MISMO', razon: 'r' }, { par: 'b+c', veredicto: 'quiza' }]) // prettier-ignore
    expect(v.map((x) => x.desenlace)).toEqual(['mismo', 'sin_decidir', 'sin_decidir'])
    expect(v[0]).toMatchObject({ par: 'a+b', razon: 'r' })
    expect(veredictosDePares([AB], [{ par: 'a+b', veredicto: 'DISTINTOS', razon: 'facetas' }])[0]?.desenlace).toBe('distintos') // prettier-ignore
  })
})

describe('fusionesDelLote: solo los MISMO, por componentes, la mas antigua sobrevive', () => {
  const mismo = (p: Par): VeredictoDePar => ({
    par: p.id,
    a: p.a,
    b: p.b,
    desenlace: 'mismo',
    razon: ''
  })
  it('un DISTINTOS no funde nada; un MISMO funde hacia la mas antigua y registra la clave de la ganadora', () => {
    expect(
      fusionesDelLote([{ par: 'a+b', a: AB.a, b: AB.b, desenlace: 'distintos', razon: '' }])
    ).toEqual([])
    expect(fusionesDelLote([mismo(AB)])).toEqual([
      { ganadora: 'a', absorbidas: ['b'], identidad: 'f.ts|10|x' }
    ])
  })

  it('dos pares encadenados (a~b, b~c) son UNA fusion con dos absorbidas', () => {
    expect(fusionesDelLote([mismo(AB), mismo(BC)])).toEqual([{ ganadora: 'a', absorbidas: ['b', 'c'], identidad: 'f.ts|10|x' }]) // prettier-ignore
  })
})
