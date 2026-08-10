import { describe, expect, it } from 'vitest'
import { parseOmegaResponse } from './omega-parse'

const VALIDO =
  'bla bla VERDICT:{"resuelve_el_hallazgo":"SI","respeta_scope":"SI",' +
  '"respeta_doNotTouch":"SI","calidad_del_diff":"BUENO","riesgo_residual":"NINGUNO",' +
  '"veredicto_global":"APROBADO","razon":"fix minimo y correcto"}:END-VERDICT bla'

describe('parseOmegaResponse', () => {
  it('bloque valido: verdict tipado con los 6 ejes y la razon', () => {
    const result = parseOmegaResponse(VALIDO)
    expect('verdict' in result && result.verdict.veredicto_global).toBe('APROBADO')
    expect('verdict' in result && result.verdict.razon).toBe('fix minimo y correcto')
  })

  it('sin bloque VERDICT: error, no se inventa nada', () => {
    expect(parseOmegaResponse('el fix se ve bien')).toMatchObject({ error: expect.stringContaining('VERDICT') }) // prettier-ignore
  })

  it('JSON roto dentro del bloque: error', () => {
    expect(parseOmegaResponse('VERDICT:{no json}:END-VERDICT')).toMatchObject({ error: expect.stringContaining('JSON') }) // prettier-ignore
  })

  it('eje con valor desconocido o ausente: error (no se inventan ejes)', () => {
    const raro = VALIDO.replace('"BUENO"', '"EXCELENTE"')
    expect('error' in parseOmegaResponse(raro)).toBe(true)
    const incompleto = VALIDO.replace('"respeta_scope":"SI",', '')
    expect('error' in parseOmegaResponse(incompleto)).toBe(true)
  })

  it('veredicto_global inconsistente con los ejes NO invalida el parse', () => {
    // resuelve=NO pero global=APROBADO: parse ok; el mismatch lo caza el motor.
    const inconsistente = VALIDO.replace('"resuelve_el_hallazgo":"SI"', '"resuelve_el_hallazgo":"NO"') // prettier-ignore
    const result = parseOmegaResponse(inconsistente)
    expect('verdict' in result && result.verdict.veredicto_global).toBe('APROBADO')
  })

  it('razon vacia: error', () => {
    expect('error' in parseOmegaResponse(VALIDO.replace('fix minimo y correcto', '  '))).toBe(true)
  })
})
