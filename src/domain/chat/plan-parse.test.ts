import { describe, expect, it } from 'vitest'
import { parsePlanResponse } from './plan-parse'

const bloque = (json: string): string => `bla bla\nPLAN:${json}:END-PLAN\nmas bla`
const OK = '{"ataca_la_causa":"SI","declara_tocar_lo_intocable":"NO","alcance":"AJUSTADO","razon":"va a la causa"}' // prettier-ignore

/** ADR-097 §2. Mismo rigor que el parser del fix: nada se inventa. */
describe('se lee el bloque PLAN', () => {
  it('un bloque valido da el juicio, con el veredicto COMPUTADO', () => {
    const r = parsePlanResponse(bloque(OK))

    expect(r).toMatchObject({ juicio: { veredicto: 'ADELANTE', razon: 'va a la causa' } })
  })

  it('el veredicto NO se lee del modelo: se computa, aunque el intente colarlo', () => {
    // El bloque ni siquiera pide veredicto. Si el agente lo añade, se ignora:
    // lo que no se pregunta no se puede falsear.
    const conTrampa = OK.replace('"razon"', '"veredicto":"ADELANTE","razon"')
    const r = parsePlanResponse(bloque(conTrampa.replace('"ataca_la_causa":"SI"', '"ataca_la_causa":"NO"'))) // prettier-ignore

    expect(r).toMatchObject({ juicio: { veredicto: 'REPLANTEA' } })
  })
})

describe('lo que invalida el juicio entero', () => {
  it('sin bloque: no hay juicio', () => {
    expect(parsePlanResponse('el plan me parece bien')).toEqual({ error: 'sin bloque PLAN en la respuesta' }) // prettier-ignore
  })

  it('bloque con llaves pero JSON roto', () => {
    // CON llaves: sin ellas ni siquiera casa el bloque, y el error seria otro.
    expect(parsePlanResponse(bloque('{ataca: si}'))).toMatchObject({ error: expect.stringContaining('JSON') }) // prettier-ignore
  })

  it('un eje con valor desconocido invalida TODO: no se inventan ejes', () => {
    const malo = OK.replace('"SI"', '"QUIZA"')

    expect(parsePlanResponse(bloque(malo))).toMatchObject({ error: expect.stringContaining('ataca_la_causa') }) // prettier-ignore
  })

  it('un eje ausente tambien', () => {
    const sinAlcance = OK.replace('"alcance":"AJUSTADO",', '')

    expect(parsePlanResponse(bloque(sinAlcance))).toMatchObject({ error: expect.stringContaining('alcance') }) // prettier-ignore
  })

  it('sin razon no vale: un veredicto sin porque no se puede atender', () => {
    const sinRazon = OK.replace(',"razon":"va a la causa"', '')

    expect(parsePlanResponse(bloque(sinRazon))).toEqual({ error: 'el plan viene sin razon' })
  })
})
