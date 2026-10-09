import { afterAll, describe, expect, it } from 'vitest'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { argsDeLectura, argsDelGenerador } from './generator-args'

/** PASO 137 (frontera FIRMADA): el cinturon del generador — los DOS casos
 *  pineados, o el mutante siempre/nunca vive (lo exigio el analista en la
 *  propuesta 166d697b). Con confianza, IDENTICO a hoy: lista vacia. */

afterAll(limpiarCarpetasDePrueba)

const DIR = '/grafo/turno'
const flagsDe = (r: ReturnType<typeof argsDelGenerador>): readonly string[] => {
  if (!r.ok) throw new Error(r.error)
  return r.value.args
}

describe('el cinturon: --setting-sources segun la confianza', () => {
  it('GENERADOR CONFIABLE y lectura confiable: sin --setting-sources, como hoy', () => {
    const gen = flagsDe(argsDelGenerador('p', carpetaDePrueba('cint-g-'), DIR, true))
    expect(gen).not.toContain('--setting-sources')
    const lec = flagsDe(argsDeLectura('p', carpetaDePrueba('cint-l-'), DIR, 'analista', true))
    expect(lec).not.toContain('--setting-sources')
  })

  it('GENERADOR NO CONFIABLE y lectura sin confianza: --setting-sources user', () => {
    const gen = flagsDe(argsDelGenerador('p', carpetaDePrueba('cint-g2-'), DIR, false))
    expect(gen[gen.indexOf('--setting-sources') + 1]).toBe('user')
    const lec = flagsDe(argsDeLectura('p', carpetaDePrueba('cint-l2-'), DIR, 'omega', false))
    expect(lec[lec.indexOf('--setting-sources') + 1]).toBe('user')
  })
})
