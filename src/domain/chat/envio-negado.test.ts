import { describe, expect, it } from 'vitest'
import { err, ok } from '../shared/result'
import { esEnvioNegado, negado } from './envio-negado'

describe('un envio que una PUERTA nego no es un turno que fallo', () => {
  it('lleva que puerta lo nego, ademas de las palabras', () => {
    expect(negado('barrera', 'la barrera esta muerta')).toEqual({
      ok: false,
      error: 'la barrera esta muerta',
      puerta: 'barrera'
    })
  })

  it('sigue siendo un Result fallido: quien solo mire `ok` no nota el cambio', () => {
    const r = negado('carril', 'tope diario alcanzado')
    expect(r.ok).toBe(false)
    expect(r.error).toBe('tope diario alcanzado')
  })

  it('se reconoce; un turno que REVENTO, no', () => {
    expect(esEnvioNegado(negado('plan-sin-aprobar', 'x'))).toBe(true)
    // Misma forma por fuera —`ok: false`—, pero el turno EXISTIO: gasto, pudo
    // editar y murio. Confundirlos cortaria el lote por una averia de un turno.
    expect(esEnvioNegado(err('el CLI se cayo'))).toBe(false)
    expect(esEnvioNegado(ok({}))).toBe(false)
  })

  it('una puerta inventada no cuela: el vocabulario es cerrado', () => {
    // Lo que cruza el puente IPC es JSON: puede traer cualquier cosa en `puerta`.
    const inventada = { ok: false, error: 'x', puerta: 'la-que-sea' }
    expect(esEnvioNegado(inventada)).toBe(false)
  })
})
