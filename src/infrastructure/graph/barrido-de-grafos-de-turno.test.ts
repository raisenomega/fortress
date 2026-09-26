import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { barrerGrafosDeTurnos } from './grafo-del-turno'

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
})
