import { describe, expect, it } from 'vitest'
import { fuentes, llamadas, rutasSinAgente } from './modelo-barrera-fixture'
import { clasificar, declara, modelosFijos } from './modelo-barrera-reglas-fixture'

/**
 * LA BARRERA DEL MODELO (ADR-078, enmienda 2026-10-05): ningun agente de la app
 * hereda el modelo del CLI. Por LLAMADA, no por fichero: cada lanzamiento de
 * proceso de `src/` se clasifica por la forma EXACTA de su binario; si es
 * claude, sus args se rastrean hasta un declarante, o son una de las tres
 * invocaciones exentas exactas. Una forma de binario desconocida pone el gate
 * rojo hasta que alguien la clasifique. Verde = no queda un lanzamiento sin modelo.
 */
const todas = fuentes()
const porRuta = new Map(todas.map((f) => [f.ruta, f]))
const ll = todas.flatMap(llamadas).map((l) => {
  const f = porRuta.get(l.ruta) as (typeof todas)[number]
  return { donde: `${l.ruta}:${l.linea}`, clase: clasificar(l, f), declara: declara(l, f), bin: l.bin }
})
const nulas = todas.flatMap((f) => rutasSinAgente(f).map((r) => ({ donde: `${f.ruta}:${r.linea}`, declara: r.declara }))) // prettier-ignore

describe('puerta CLI, llamada por llamada', () => {
  it('el censo se deriva entero y no esta vacio', () => {
    expect(ll.filter((l) => l.clase === 'claude').length).toBeGreaterThanOrEqual(7)
    expect(nulas.length).toBeGreaterThanOrEqual(6)
  })

  it.each(ll.map((l) => l.donde))('%s: su binario tiene una forma conocida', (donde) => {
    const l = ll.find((x) => x.donde === donde)
    expect({ donde, bin: l?.bin, clase: l?.clase }).not.toMatchObject({ clase: 'desconocida' })
  })

  it.each(ll.filter((l) => l.clase === 'claude').map((l) => l.donde))('%s: lanza claude CON su modelo', (donde) => {
    expect({ donde, declara: ll.find((x) => x.donde === donde)?.declara }).toEqual({ donde, declara: true })
  })

  it.each(nulas.map((n) => n.donde))('turno sin agente en %s lleva model:', (donde) => {
    expect(nulas.find((n) => n.donde === donde)?.declara).toBe(true)
  })
})

describe('alias en TODAS las puertas (CLI y SDK)', () => {
  it.each(todas.map((f) => f.ruta))('%s no clava ningun id de modelo', (ruta) => {
    expect({ ruta, fijos: modelosFijos(porRuta.get(ruta) as (typeof todas)[number]) }).toEqual({ ruta, fijos: [] }) // prettier-ignore
  })

  it.each(todas.filter((f) => /new Anthropic\(/.test(f.fuente)).map((f) => f.ruta))('%s resuelve el alias en el catalogo', (ruta) => { // prettier-ignore
    expect(/modeloDeLaApi\(/.test(porRuta.get(ruta)?.fuente ?? '')).toBe(true)
  })
})
