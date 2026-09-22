import { describe, expect, it } from 'vitest'
import { fusionesDelPasoB } from './fusiones-del-paso-b'
import type { Veredicto } from './veredicto-del-lote-tipos'

const CLAVE = 'public/_headers|6|cabecera-de-seguridad-ausente'
const real = (id: string): Veredicto => ({ id, desenlace: 'real', razon: 'sigue', tipo: 'cabecera-de-seguridad-ausente', simbolo: '', identidad_nueva: CLAVE, nota: null }) // prettier-ignore
const extinguida = (id: string): Veredicto => ({ id, desenlace: 'extinguida', motivo: 'm', tipo: 'cabecera-de-seguridad-ausente', simbolo: '', identidad_nueva: CLAVE, nota: null }) // prettier-ignore
const visto = (pares: readonly (readonly [string, string])[]): ReadonlyMap<string, string> =>
  new Map(pares)

describe('fusionesDelPasoB: lo que quedaria repetido despues de juzgar', () => {
  it('tres REAL con la misma clave de hoy son un defecto: sobrevive la mas antigua', () => {
    const plan = fusionesDelPasoB([], [real('b'), real('a'), real('c')], visto([['a', '2026-08-17'], ['b', '2026-08-21'], ['c', '2026-08-19']])) // prettier-ignore
    expect(plan).toEqual([{ ganadora: 'a', absorbidas: ['b', 'c'], identidad: CLAVE }])
  })

  it('una extinguida no compite: esta muerta, no repite clave con nadie', () => {
    const plan = fusionesDelPasoB([], [extinguida('a'), real('b')], visto([['a', '2026-08-17'], ['b', '2026-08-21']])) // prettier-ignore
    expect(plan).toEqual([])
  })

  it('una REAL que choca con una viva de hoy: gana la viva, que lleva mas tiempo', () => {
    const viva = { id: 'v', identidad: CLAVE, firstSeen: '2026-08-01' }
    const plan = fusionesDelPasoB([viva], [real('b')], visto([['b', '2026-08-21']]))
    expect(plan).toEqual([{ ganadora: 'v', absorbidas: ['b'], identidad: CLAVE }])
  })

  it('sin decidir no entra, y una juzgada sin first_seen es un fallo de cableado', () => {
    const sinDecidir: Veredicto = { id: 'x', desenlace: 'sin_decidir', motivo: 'sin respuesta' }
    expect(fusionesDelPasoB([], [sinDecidir], visto([]))).toEqual([])
    expect(() => fusionesDelPasoB([], [real('b')], visto([]))).toThrow('first_seen')
  })
})
