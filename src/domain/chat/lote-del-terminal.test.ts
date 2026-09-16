import { describe, expect, it } from 'vitest'
// prettier-ignore
import { alternarEnLote, loteDisponible, textoDelPlan, TOPE_DEL_LOTE } from './lote-del-terminal'

describe('el lote se ofrece donde el Terminal resuelve, en los dos modos', () => {
  it('proyecto resoluble: si', () => {
    expect(loteDisponible(true)).toBe(true)
  })

  it('el repo propio de FORTRESS (resoluble=false): no', () => {
    expect(loteDisponible(false)).toBe(false)
  })

  it('el modo NO lo esconde: decide el flujo, no la casilla', () => {
    // En supervisado es donde hoy resuelve; esconderlo ahi lo dejaba inutil.
    expect(loteDisponible(true)).toBe(true)
  })
})

describe('el mensaje de plan que se precarga', () => {
  it('nombra el proyecto y cuantos son, y no pide volver a escanear', () => {
    const texto = textoDelPlan('mailbd-main', 5)

    expect(texto).toContain('los 5 hallazgos seleccionados')
    expect(texto).toContain('de mailbd-main')
    expect(texto).toContain('plan y orden de ejecucion')
    expect(texto).toContain('No hace falta volver a escanear')
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
