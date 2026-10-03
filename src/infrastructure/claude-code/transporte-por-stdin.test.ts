import { afterAll, describe, expect, it } from 'vitest'
import { carpetaDePrueba, limpiarCarpetasDePrueba } from '../carpeta-de-prueba-fixture'
import { argsDeIndexar } from '../graph/index-graph'
import { verifyArgs } from '../graph/verify-graph'
import { argsDeLectura, argsDelGenerador } from '../repair/generator-args'
import { buildArgs } from './claude-cli'

afterAll(limpiarCarpetasDePrueba)

/** ADR-112: 200 KB — lo que en argv revienta Linux (128 KiB/arg) y Windows
 *  (32.767 total). Por stdin, los ARGS se quedan chicos pase lo que pase. */
const GORDO = 'x'.repeat(200 * 1024)
const WINDOWS_TOTAL = 32767
const pedazo = GORDO.slice(0, 64)
const chicos = (args: readonly string[]): void => {
  expect(args.join(' ')).not.toContain(pedazo)
  // `-p` queda SIN valor: lo que sigue es otro flag, y el prompt va por stdin.
  expect(args[args.indexOf('-p') + 1] ?? '--fin').toMatch(/^--/)
  expect(args.join(' ').length).toBeLessThan(WINDOWS_TOTAL)
}

describe('ADR-112: el prompt viaja por stdin en los CUATRO constructores', () => {
  it('el CLI del Terminal/escaner (buildArgs), con 200 KB dentro', () => {
    const l = buildArgs(GORDO, 'lectura', {}, null, 0)
    expect(l.prompt).toBe(GORDO)
    chicos(l.args)
  })

  it('el generador — edicion y lectura — con la caja puesta', () => {
    const wt = carpetaDePrueba('.fortress-stdin-gen-')
    for (const construir of [argsDelGenerador, argsDeLectura]) {
      const r = construir(GORDO, wt, '/grafo/turno')
      if (!r.ok) throw new Error(r.error)
      expect(r.value.prompt).toBe(GORDO)
      chicos(r.value.args)
    }
  })

  it('index-graph y verify-graph: sus prompts fijos tambien viajan aparte', () => {
    for (const l of [argsDeIndexar(), verifyArgs()]) {
      expect(l.prompt.length).toBeGreaterThan(0)
      expect(l.args.join(' ')).not.toContain(l.prompt)
      expect(l.args[l.args.indexOf('-p') + 1] ?? '--fin').toMatch(/^--/)
    }
  })
})
