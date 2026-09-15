import { describe, expect, it } from 'vitest'
import { alternarEnLote, loteDisponible, TOPE_DEL_LOTE } from './lote-del-terminal'

describe('el lote se ofrece solo donde el Terminal resuelve de verdad', () => {
  it('resoluble y en autonomo: si', () => {
    expect(loteDisponible(true, 'autonomo')).toBe(true)
  })

  it('el repo propio de FORTRESS (resoluble=false): no, ni en autonomo', () => {
    expect(loteDisponible(false, 'autonomo')).toBe(false)
  })

  it('en supervisado: no, cada turno esperaria su Aprobar y no editaria', () => {
    expect(loteDisponible(true, 'supervisado')).toBe(false)
    expect(loteDisponible(false, 'supervisado')).toBe(false)
  })
})

describe(`el tope del lote: ${TOPE_DEL_LOTE}`, () => {
  const diez = new Set(Array.from({ length: TOPE_DEL_LOTE }, (_, i) => `f${i}`))

  it('se anade hasta el tope', () => {
    const r = alternarEnLote(new Set(['f0']), 'f1')
    expect([...r.seleccion]).toEqual(['f0', 'f1'])
    expect(r.lleno).toBe(false)
  })

  it('el 11 no entra: la seleccion vuelve igual y avisa', () => {
    const r = alternarEnLote(diez, 'f10')
    expect(r.lleno).toBe(true)
    expect(r.seleccion).toBe(diez)
    expect(r.seleccion.size).toBe(TOPE_DEL_LOTE)
  })

  it('en el tope, quitar sigue pudiendose', () => {
    const r = alternarEnLote(diez, 'f3')
    expect(r.lleno).toBe(false)
    expect(r.seleccion.has('f3')).toBe(false)
    expect(r.seleccion.size).toBe(TOPE_DEL_LOTE - 1)
  })
})
