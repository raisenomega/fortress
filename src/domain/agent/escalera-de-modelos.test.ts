import { describe, expect, it } from 'vitest'
import { CIMA, ESCALERA, MODELO_DEL_PRODUCTOR, peldanoDeDebajo } from './escalera-de-modelos'

describe('la escalera de modelos: la cima arriba, el productor un peldano debajo', () => {
  it('hoy la cima es fable (PENDIENTE ADR-078) y el productor sale opus', () => {
    expect(CIMA).toBe('fable')
    expect(MODELO_DEL_PRODUCTOR).toBe('opus')
  })

  it('el productor se DERIVA de la cima: es justo el peldano de debajo', () => {
    expect(ESCALERA.indexOf(MODELO_DEL_PRODUCTOR)).toBe(ESCALERA.indexOf(CIMA) + 1)
  })

  it('cada peldano tiene su de-debajo, y la base se queda en si misma', () => {
    expect(ESCALERA.map(peldanoDeDebajo)).toEqual(['opus', 'sonnet', 'haiku', 'haiku'])
  })

  it('la cima nunca es la base: si lo fuera, el productor no quedaria por debajo', () => {
    expect(peldanoDeDebajo(CIMA)).not.toBe(CIMA)
  })

  it('con la cima en opus el productor caeria a sonnet: la bajada que se evita', () => {
    expect(peldanoDeDebajo('opus')).toBe('sonnet')
  })
})
