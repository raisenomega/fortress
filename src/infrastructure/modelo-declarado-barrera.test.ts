import { describe, expect, it } from 'vitest'
import { DECLARANTES, fuentes, lanzanClaude, rutasSinAgente, sinComentarios, usanElSdk } from './modelo-barrera-fixture'

/**
 * LA BARRERA DEL MODELO (ADR-078, enmienda 2026-10-05): ningun agente de la app
 * hereda el modelo del CLI. La noche del 05-oct los del Motor no declaraban y el
 * CLI les dio Fable. La lista de lanzadores se DERIVA (molde de
 * `spawn-entorno-acotado`): un lanzador nuevo sin declarante pone el gate rojo.
 * Que esta barrera este VERDE es la prueba de que no queda uno sin modelo.
 */
const todas = fuentes()
const cli = lanzanClaude(todas)
const sdk = usanElSdk(todas)
const nulas = todas.flatMap((f) => rutasSinAgente(f).map((r) => ({ ruta: `${f.ruta}:${r.linea}`, declara: r.declara }))) // prettier-ignore

describe('puerta CLI: todo lanzador de claude declara su modelo', () => {
  it('el censo se deriva y no esta vacio (si el barrido falla, se nota)', () => {
    expect(cli.length).toBeGreaterThanOrEqual(7)
    expect(nulas.length).toBeGreaterThanOrEqual(5)
  })

  it.each(cli.map((f) => f.ruta))('%s construye sus args con un declarante', (ruta) => {
    const f = cli.find((x) => x.ruta === ruta)
    expect({ ruta, declara: DECLARANTES.test(f?.fuente ?? '') }).toEqual({ ruta, declara: true })
  })

  it.each(nulas.map((n) => n.ruta))('turno sin agente en %s lleva model:', (ruta) => {
    expect(nulas.find((n) => n.ruta === ruta)?.declara).toBe(true)
  })
})

describe('puerta SDK: el chat por API resuelve el alias, nunca un id fijo', () => {
  it('el censo del SDK se deriva y no esta vacio', () => expect(sdk.length).toBeGreaterThanOrEqual(2))

  it.each(sdk.map((f) => f.ruta))('%s usa modeloDeLaApi y no clava ningun id', (ruta) => {
    const fuente = sinComentarios(sdk.find((x) => x.ruta === ruta)?.fuente ?? '')
    const idFijo = /['"]claude-(?:opus|sonnet|haiku|fable)-[\d-]+['"]/.test(fuente)
    expect({ ruta, resuelve: /modeloDeLaApi\(/.test(fuente), idFijo }).toEqual({ ruta, resuelve: true, idFijo: false }) // prettier-ignore
  })
})
