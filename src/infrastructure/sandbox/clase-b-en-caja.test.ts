import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * Todo lanzamiento de la CLASE B —lo que FORTRESS corre del proyecto auditado:
 * el gate, las sondas, git en el arbol del cliente— pasa por `enCaja`
 * (ADR-092, casilla 3). La lista es la que el ADR nombro, y aqui se ATA: quien
 * anada un lanzador y no lo envuelva, cae aqui.
 *
 * Se juzga codigo, no comentarios: un docblock que nombre `enCaja` no cuenta.
 */
const CLASE_B = [
  'src/infrastructure/repair/spawn-command.ts',
  'src/infrastructure/probe/run-command.ts',
  'src/infrastructure/repair/repair-git.ts',
  'src/infrastructure/repair/git-del-merge.ts'
]

const codigo = (t: string): string =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

describe('el gate sale a la red SOLO por el proxy de registros (casilla 2)', () => {
  it('spawn-command abre el proxy y le pasa SU socket a enCaja: ni red abierta ni muerta', () => {
    const fuente = codigo(readFileSync('src/infrastructure/repair/spawn-command.ts', 'utf8'))
    expect(/\babrirProxyDeRegistros\(/.test(fuente)).toBe(true)
    expect(/enCaja\([^)]*proxy\.socket\)/.test(fuente)).toBe(true)
  })
})

describe('la clase B corre dentro de la caja', () => {
  it.each(CLASE_B)('%s lanza por enCaja, no a pelo', (ruta) => {
    const fuente = codigo(readFileSync(ruta, 'utf8'))
    expect({ ruta, enCaja: /\benCaja\(/.test(fuente) }).toEqual({ ruta, enCaja: true })
  })

  it.each(CLASE_B)('%s no conserva un spawn del binario sin envolver', (ruta) => {
    const fuente = codigo(readFileSync(ruta, 'utf8'))
    // Lo unico que se lanza es lo que `enCaja` devuelve: `.bin` y `.args`.
    const lanzamientos = [...fuente.matchAll(/\b(?:spawn|execFile)\(\s*([^,]+),/g)].map((m) =>
      m[1]?.trim()
    )
    expect({ ruta, lanzamientos: lanzamientos.filter((l) => !/\.bin$/.test(l ?? '')) }).toEqual({ ruta, lanzamientos: [] }) // prettier-ignore
  })
})
