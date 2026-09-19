import { describe, expect, it } from 'vitest'
import { computarVeredictoDelPlan, puedeSeguir, type EjesDelPlan } from './juicio-del-plan'

const SENSATO: EjesDelPlan = {
  ataca_la_causa: 'SI',
  declara_tocar_lo_intocable: 'NO',
  alcance: 'AJUSTADO'
}

/**
 * ADR-097 §2. El veredicto del plan lo computa el CODIGO (D19), y su dureza es
 * deliberadamente menor que la del fix: juzga una promesa, no un hecho.
 */
describe('el veredicto del plan sale de los ejes', () => {
  it('un plan sensato sigue adelante', () => {
    expect(computarVeredictoDelPlan(SENSATO)).toBe('ADELANTE')
  })

  it('si declara tocar lo intocable, replantea', () => {
    expect(computarVeredictoDelPlan({ ...SENSATO, declara_tocar_lo_intocable: 'SI' })).toBe('REPLANTEA') // prettier-ignore
  })

  it('si NO ataca la causa, replantea: arreglar el sintoma no cierra nada', () => {
    expect(computarVeredictoDelPlan({ ...SENSATO, ataca_la_causa: 'NO' })).toBe('REPLANTEA')
  })
})

describe('LA DUREZA: este cedazo es blando a proposito', () => {
  it('NO_SE_PUEDE_SABER no deniega: el filtro no alcanza, el plan no es malo', () => {
    // Denegarlo seria fingir una dureza que no tiene. La red que mira HECHOS es
    // el juicio del fix, y corre despues.
    expect(computarVeredictoDelPlan({ ...SENSATO, ataca_la_causa: 'NO_SE_PUEDE_SABER' })).toBe('ADELANTE') // prettier-ignore
  })

  it('un alcance AMPLIO tampoco deniega por si solo', () => {
    // Puede estar justificado, y decidirlo sin ver el codigo seria adivinar.
    expect(computarVeredictoDelPlan({ ...SENSATO, alcance: 'AMPLIO' })).toBe('ADELANTE')
  })

  it('solo dos caminos denegan, y los dos son afirmaciones del plan', () => {
    // Se deniega por lo que el plan DICE, nunca por lo que no se sabe.
    const deniegan = [
      { ...SENSATO, declara_tocar_lo_intocable: 'SI' as const },
      { ...SENSATO, ataca_la_causa: 'NO' as const }
    ].map(computarVeredictoDelPlan)

    expect(deniegan).toEqual(['REPLANTEA', 'REPLANTEA'])
  })
})

describe('el vocabulario NO es el del fix', () => {
  it('dice ADELANTE, no APROBADO: son dos filtros de dureza distinta', () => {
    // Si compartieran palabra, un APROBADO en un log no diria cual lo emitio.
    const v = computarVeredictoDelPlan(SENSATO)
    expect(v).not.toBe('APROBADO')
    expect(puedeSeguir(v)).toBe(true)
  })

  it('dice REPLANTEA, no VETADO', () => {
    expect(computarVeredictoDelPlan({ ...SENSATO, ataca_la_causa: 'NO' })).not.toBe('VETADO')
  })
})
