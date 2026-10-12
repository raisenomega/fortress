import { describe, expect, it } from 'vitest'
import { lazoStop, type LazoState } from './lazo-decision'

const SANO: LazoState = {
  cancelled: false,
  topeDiario: false,
  iteraciones: 0,
  maxIteraciones: 8,
  nadaQueHacer: false
}

describe('lazoStop: la unica decision de parada del lazo CTO<->Terminal (2b-b)', () => {
  it('sano y con trabajo -> sigue (null)', () => {
    expect(lazoStop(SANO)).toBeNull()
  })

  it('T3: Detener manda sobre todo', () => {
    expect(lazoStop({ ...SANO, cancelled: true, nadaQueHacer: true })).toBe('detenido')
  })

  it('T3: tope diario de gasto para', () => {
    expect(lazoStop({ ...SANO, topeDiario: true })).toBe('tope-diario')
  })

  it('T3: alcanzar el maximo de vueltas para', () => {
    expect(lazoStop({ ...SANO, iteraciones: 8 })).toBe('tope-vueltas')
  })

  it('T4: sin nada que hacer para', () => {
    expect(lazoStop({ ...SANO, nadaQueHacer: true })).toBe('nada-que-hacer')
  })

  it('prioridad: el tope de vueltas manda sobre nada-que-hacer', () => {
    expect(lazoStop({ ...SANO, iteraciones: 9, nadaQueHacer: true })).toBe('tope-vueltas')
  })
})
