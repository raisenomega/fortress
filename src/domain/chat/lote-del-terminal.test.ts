import { describe, expect, it } from 'vitest'
import { alternarEnLote, loteDisponible, textoDelPlan } from './lote-del-terminal'
import { LOTE_LARGO, SUGERIDO_DEL_LOTE, textoDeLaTanda } from './lote-del-terminal'

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

describe('sin tope duro: la barra avisa, no bloquea', () => {
  const quince = new Set(Array.from({ length: 15 }, (_, i) => `f${i}`))

  it('se pueden seleccionar mas de 10: el 16 entra igual', () => {
    const siguiente = alternarEnLote(quince, 'f15')
    expect(siguiente.size).toBe(16)
    expect(siguiente.has('f15')).toBe(true)
  })

  it('quitar sigue funcionando con la tanda larga', () => {
    expect(alternarEnLote(quince, 'f3').has('f3')).toBe(false)
  })

  it('hasta 10 la barra solo cuenta y sugiere, sin la palabra «maximo»', () => {
    const texto = textoDeLaTanda(LOTE_LARGO)
    expect(texto).toBe(`${LOTE_LARGO} en el lote · sugerido ${SUGERIDO_DEL_LOTE}`)
    expect(texto).not.toContain('maximo')
  })

  it('al pasar de 10 aparece la nota de tanda larga, y sigue sin ser un limite', () => {
    const texto = textoDeLaTanda(LOTE_LARGO + 1)
    expect(texto).toContain(`${LOTE_LARGO + 1} en el lote`)
    expect(texto).toContain('tardan mas')
    expect(texto).not.toContain('maximo')
  })
})
