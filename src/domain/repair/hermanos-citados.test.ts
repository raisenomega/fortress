import { describe, expect, it } from 'vitest'
import { hermanosCitados, hermanosDelHallazgo } from './hermanos-del-hallazgo'
import { h, T } from './hermanos-del-hallazgo-fixture'

describe('la cita lleva el id, y hermanosCitados dice a quien se cito (ADR-101, corte 2)', () => {
  it('cada hermano se cita con su id entre corchetes, y se le pide mismoDefectoQue', () => {
    const texto = hermanosDelHallazgo(T, [h('sede')]) ?? ''
    expect(texto).toContain('[sede] supabase/functions/send-invoice/index.ts:268 — t-sede')
    expect(texto).toContain('"mismoDefectoQue"')
  })

  it('hermanosCitados devuelve los ids en el orden de la cita, sede primero, y como mucho 5', () => {
    const clase = Array.from({ length: 6 }, (_, i) => h(`c${i}`, { file: `otro${i}.ts`, simbolo: 'x', line: 1 })) // prettier-ignore
    const sede = [h('s0', { line: 258, tipo: 'otro' }), h('f1')]
    expect(hermanosCitados(T, [...clase, ...sede])).toEqual(['s0', 'c0', 'c1', 'c2', 'c3'])
  })

  it('sin hermanos, no hay citados', () => {
    expect(hermanosCitados(T, [])).toEqual([])
  })
})
