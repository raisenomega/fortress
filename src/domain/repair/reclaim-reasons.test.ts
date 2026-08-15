import { describe, expect, it } from 'vitest'
import { RECLAIM_REASONS } from './reclaim-reasons'

describe('RECLAIM_REASONS: cada razon nombra un diagnostico distinto', () => {
  it('la cadena sintetica tiene razon propia', () => {
    // Una propuesta de backfill no puede generar por mas veces que se pulse:
    // su libro no guarda el analisis y C3 se quedaria sin entrada. No es
    // ninguna de las cuatro de reconciliacion — no la ve el disco, la ve el
    // guard al ir a generar.
    expect(RECLAIM_REASONS.CADENA_SINTETICA).toBe('cadena_sintetica')
  })

  it('ninguna razon repite valor: cada una dice algo que las otras no', () => {
    const valores = Object.values(RECLAIM_REASONS)
    expect(new Set(valores).size).toBe(valores.length)
  })
})
