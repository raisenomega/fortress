import { describe, expect, it } from 'vitest'
import { notasDeBloque, notasDeObjeto, sinRepetidas } from './extraer-notas'
import type { SelfNoteDraft } from './self-observation'

const NOTA: SelfNoteDraft = { kind: 'limitacion', area: 'consulta-del-grafo', note: 'no pude trazar el simbolo' }

describe('las dos puertas entregan lo mismo al mismo parser', () => {
  it('del OBJETO: `notes` como clave hermana (escaner, OMEGA)', () => {
    expect(notasDeObjeto({ findings: [], notes: [NOTA] })).toEqual([NOTA])
  })

  it('del BLOQUE: un segundo delimitado (el juez, cuyo payload es un array)', () => {
    const salida = `APLICA:[{"modulo":"M8"}]:END-APLICA\nNOTAS:[${JSON.stringify(NOTA)}]:END-NOTAS`

    expect(notasDeBloque(salida)).toEqual([NOTA])
  })

  it('sin notas, ninguna de las dos inventa nada', () => {
    expect(notasDeObjeto({ findings: [] })).toEqual([])
    expect(notasDeBloque('APLICA:[]:END-APLICA')).toEqual([])
  })

  it('un bloque ilegible no rompe: devuelve vacio, no lanza', () => {
    expect(() => notasDeBloque('NOTAS:[esto no es json]:END-NOTAS')).not.toThrow()
    expect(notasDeBloque('NOTAS:[esto no es json]:END-NOTAS')).toEqual([])
  })

  it('y una nota mal formada se cae SOLA, sin llevarse las buenas', () => {
    const mezcla = { notes: [NOTA, { kind: 'inventado', area: 'otro', note: 'y' }, { area: 'sin kind' }] } // prettier-ignore

    expect(notasDeObjeto(mezcla)).toEqual([NOTA])
  })
})

describe('las copias se funden: el escaner corre 12 veces', () => {
  it('doce paradas con la MISMA queja dejan UNA nota', () => {
    const doce = Array.from({ length: 12 }, () => ({ ...NOTA }))

    expect(sinRepetidas(doce)).toEqual([NOTA])
  })

  it('pero dos quejas DISTINTAS siguen siendo dos: no se colapsa de mas', () => {
    const otra = { ...NOTA, note: 'el grafo no indexa politicas RLS' }

    expect(sinRepetidas([NOTA, otra, NOTA])).toEqual([NOTA, otra])
  })

  it('el area tambien cuenta: mismo texto en dos zonas son dos observaciones', () => {
    const enOtraZona: SelfNoteDraft = { ...NOTA, area: 'contrato-del-hallazgo' }

    expect(sinRepetidas([NOTA, enOtraZona])).toHaveLength(2)
  })
})
