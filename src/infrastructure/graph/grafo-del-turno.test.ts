import Database from 'better-sqlite3'
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { graphSlug } from '@domain/graph/graph-slug'
import { prepararGrafoDelTurno } from './grafo-del-turno'

const dirs: string[] = []
const temporal = (p: string): string => { const d = mkdtempSync(join(tmpdir(), p)); dirs.push(d); return d } // prettier-ignore
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }) }) // prettier-ignore

/** Una cache real de mentira con dos proyectos indexados: el del turno y OTRO cliente. */
function cacheConDos(): { cache: string; proyecto: string; otro: string } {
  const cache = temporal('cache-')
  const proyecto = temporal('proyecto-')
  const otro = temporal('otro-')
  for (const p of [proyecto, otro]) {
    const db = new Database(join(cache, `${graphSlug(p)}.db`))
    db.exec('CREATE TABLE projects (name TEXT, indexed_at TEXT, root_path TEXT)')
    db.prepare('INSERT INTO projects VALUES (?, ?, ?)').run(graphSlug(p), '2026-09-25T00:00:00Z', p)
    db.close()
  }
  return { cache, proyecto, otro }
}

describe('el grafo del turno: un directorio con SOLO una copia real del .db del proyecto', () => {
  it('copia el .db del proyecto con su nombre, y NO el del otro cliente', async () => {
    const { cache, proyecto, otro } = cacheConDos()
    const raiz = temporal('raiz-')
    const grafo = await prepararGrafoDelTurno(proyecto, raiz, cache)
    expect(grafo.dir.startsWith(raiz)).toBe(true)
    expect(readdirSync(grafo.dir)).toEqual([`${graphSlug(proyecto)}.db`])
    expect(existsSync(join(grafo.dir, `${graphSlug(otro)}.db`))).toBe(false)
    const copia = new Database(join(grafo.dir, `${graphSlug(proyecto)}.db`), { readonly: true })
    expect(copia.prepare('SELECT name FROM projects').get()).toEqual({ name: graphSlug(proyecto) })
    copia.close()
    grafo.liberar()
  })

  it('es una copia REAL: otro inodo (un enlace duro compartiria las escrituras con el original)', async () => {
    const { cache, proyecto } = cacheConDos()
    const grafo = await prepararGrafoDelTurno(proyecto, temporal('raiz-'), cache)
    const original = statSync(join(cache, `${graphSlug(proyecto)}.db`))
    const copia = statSync(join(grafo.dir, `${graphSlug(proyecto)}.db`))
    expect(copia.ino).not.toBe(original.ino)
    expect(copia.size).toBe(original.size)
    grafo.liberar()
  })

  it('liberar borra el directorio entero; sin .db el directorio nace vacio (el turno corre sin grafo, como hoy)', async () => {
    const raiz = temporal('raiz-')
    const grafo = await prepararGrafoDelTurno(
      temporal('sin-indice-'),
      raiz,
      temporal('cache-vacia-')
    )
    expect(readdirSync(grafo.dir)).toEqual([])
    grafo.liberar()
    expect(existsSync(grafo.dir)).toBe(false)
    expect(existsSync(raiz)).toBe(true)
  })
})
