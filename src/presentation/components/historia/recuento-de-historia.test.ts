import { describe, expect, it } from 'vitest'
import type { FindingHistoria } from '@domain/project/finding-historia'
import { recuentoDeHistoria } from './recuento-de-historia'

const fila = (extinctReason: string | null, i: number): FindingHistoria => ({
  id: `f${i}`,
  severity: 'LOW',
  title: `t${i}`,
  file: 'src/a.ts',
  line: 1,
  firstSeen: '2026-08-01T10:00:00Z',
  resolvedAt: extinctReason?.startsWith('fusionada') === true ? null : '2026-08-23T10:00:00Z',
  extinctReason,
  extinguidoPor: null
})

/** El reparto REAL de la base del operador al 2026-09-12. */
const REALES: readonly FindingHistoria[] = [
  ...Array.from({ length: 8 }, (_, i) => fila('juicio_obsoleto', i)),
  ...Array.from({ length: 20 }, (_, i) => fila(`fusionada-con-uuid-${i}`, 100 + i)),
  ...Array.from({ length: 27 }, (_, i) => fila(null, 200 + i))
]

describe('la cabecera de la historia da TRES numeros, no uno', () => {
  it('EL RECUENTO HONESTO: 8 verificados, 20 fusionados, 27 sin prueba', () => {
    // «55 resueltos» es lo que sale de contar filas, y seria falso sobre 47 de
    // ellas: veinte son duplicados absorbidos y veintisiete se cerraron cuando
    // la ausencia extinguia. Un total unico repetiria la mentira de la CSP.
    expect(recuentoDeHistoria(REALES)).toEqual([
      { clase: 'verificado', n: 8, texto: 'verificados' },
      { clase: 'fusionado', n: 20, texto: 'fusionados' },
      { clase: 'sin-prueba', n: 27, texto: 'sin prueba' }
    ])
  })

  it('y los tres suman el total, que es lo unico que un total puede decir', () => {
    expect(recuentoDeHistoria(REALES).reduce((n, l) => n + l.n, 0)).toBe(55)
  })

  it('las clases con CERO tambien se cuentan: «0 verificados» es informacion', () => {
    const soloFusiones = REALES.filter((f) => f.extinctReason?.startsWith('fusionada') === true)

    expect(recuentoDeHistoria(soloFusiones)).toEqual([
      { clase: 'verificado', n: 0, texto: 'verificados' },
      { clase: 'fusionado', n: 20, texto: 'fusionados' },
      { clase: 'sin-prueba', n: 0, texto: 'sin prueba' }
    ])
  })

  it('una historia vacia da tres ceros, no una lista vacia', () => {
    expect(recuentoDeHistoria([]).map((l) => l.n)).toEqual([0, 0, 0])
  })
})
