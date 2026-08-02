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
    expect(estimateWorkflow(0)).toMatchObject({ steps: 0, seconds: 0, usd: 0 })
  })

  it('usa lo medido en el proyecto por encima del valor de arranque', () => {
    // El valor de fabrica salio de un proyecto de tres archivos: en un repo
    // real se queda quince veces corto, que es peor que no estimar.
    const real = estimateWorkflow(7, { seconds: 300, usd: 1.05 })
    expect(real.usd).toBeCloseTo(7.35, 2)
    expect(real.measured).toBe(true)
  })

  it('avisa de que no esta medido cuando no hay historial', () => {
    expect(estimateWorkflow(3).measured).toBe(false)
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
