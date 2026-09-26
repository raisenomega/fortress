import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { barrerGrafosDeTurnos, prepararGrafoDelTurno } from './grafo-del-turno'

const dirs: string[] = []
const temporal = (p: string): string => { const d = mkdtempSync(join(tmpdir(), p)); dirs.push(d); return d } // prettier-ignore
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }) }) // prettier-ignore

describe('el barrido del arranque de los grafos por turno', () => {
  it('el barrido del arranque se lleva lo que un cierre abrupto dejo, y solo eso', () => {
    const raiz = temporal('raiz-')
    for (const n of ['turno-a', 'turno-b']) { mkdirSync(join(raiz, n)); writeFileSync(join(raiz, n, 'x.db'), 'x') } // prettier-ignore
    expect(barrerGrafosDeTurnos(raiz)).toBe(2)
    expect(readdirSync(raiz)).toEqual([])
    expect(barrerGrafosDeTurnos(join(raiz, 'no-existe'))).toBe(0)
  })

  it('liberar se lleva lo que el servidor dejo dentro (_config.db, logs/) y no revienta si ya no hay nada', async () => {
    const grafo = await prepararGrafoDelTurno(null, temporal('raiz-'), temporal('cache-'))
    mkdirSync(join(grafo.dir, 'logs'))
    writeFileSync(join(grafo.dir, 'logs', 'cbm.log'), 'x')
    writeFileSync(join(grafo.dir, '_config.db'), 'x') // prettier-ignore
    grafo.liberar()
    expect(existsSync(grafo.dir)).toBe(false)
    expect(() => grafo.liberar()).not.toThrow()
  })
})
