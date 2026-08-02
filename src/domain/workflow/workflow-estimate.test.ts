import { describe, expect, it } from 'vitest'
import { describeDuration, estimateWorkflow } from './workflow-estimate'

describe('estimateWorkflow', () => {
  it('escala con el numero de pasos', () => {
    // Siete agentes no son "un momentito": hay que poder verlo antes.
    const produccion = estimateWorkflow(7)
    expect(produccion.seconds).toBe(350)
    expect(produccion.usd).toBeCloseTo(0.49, 2)
  })

  it('un workflow vacio no cuesta nada', () => {
    expect(estimateWorkflow(0)).toEqual({ steps: 0, seconds: 0, usd: 0 })
  })
})

describe('describeDuration', () => {
  it('usa segundos cuando son pocos', () => {
    expect(describeDuration(50)).toBe('unos 50 s')
  })

  it('pasa a minutos y redondea: es una estimacion, no un cronometro', () => {
    expect(describeDuration(350)).toBe('unos 6 min')
  })
})
