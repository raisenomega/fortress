import { describe, expect, it } from 'vitest'
import { RUTA_REDACTADA } from '@domain/system/cerco-de-observacion'
import { barrerObservaciones } from './barrido-del-cerco'
import { createMemoryDb } from './memory-db'
import type { Db } from './database'

/** Dos de las ocho fugas reales del backlog, verbatim. Se insertan por SQL y no
 *  por el repositorio: el `add` ya lleva el cerco, y lo que este test necesita
 *  es una base COMO la del operador antes de que el cerco existiera. */
const CRUDO = `INSERT INTO self_observations (id, source_project, kind, area, note, resolved, created_at)
  VALUES (@id, 'mailbd-main', 'gap', @area, @note, 0, '2026-09-01')`

const sembrarSinCerco = (db: Db, filas: ReadonlyArray<[string, string, string]>): void => {
  const insert = db.prepare(CRUDO)
  for (const [id, area, note] of filas) insert.run({ id, area, note })
}

const leer = (db: Db): Array<{ area: string; note: string }> =>
  db.prepare('SELECT area, note FROM self_observations ORDER BY id').all() as never

describe('el barrido limpia lo que ya estaba escrito', () => {
  it('las citas del cliente se van y el aprendizaje se queda', () => {
    const db = createMemoryDb()
    sembrarSinCerco(db, [
      ['o1', 'trace_path ante nombres duplicados', 'el simbolo existe dos veces, en src/lib/sanitize-html.ts y en supabase/functions/_shared/escape-h'], // prettier-ignore
      ['o2', 'grafo de codigo', 'no hay nodos que conecten supabase.storage.from con el bucket']
    ])

    expect(barrerObservaciones(db)).toBe(1)

    const [uno, dos] = leer(db)
    expect(uno.note).not.toContain('src/lib/sanitize-html.ts')
    expect(uno.note).toContain('el simbolo existe dos veces')
    expect(uno.note).toContain(RUTA_REDACTADA)
    // La segunda no tenia ruta: no se toca, y por eso el recuento es 1 y no 2.
    expect(dos.note).toBe('no hay nodos que conecten supabase.storage.from con el bucket')
  })

  it('tambien barre el AREA: una de las ocho llevaba la ruta ahi', () => {
    const db = createMemoryDb()
    sembrarSinCerco(db, [['o1', 'search_graph en supabase/functions/_shared', 'devolvio total 0']])

    barrerObservaciones(db)

    expect(leer(db)[0].area).not.toContain('supabase/functions')
  })

  it('correrlo dos veces no cambia nada: es idempotente', () => {
    const db = createMemoryDb()
    sembrarSinCerco(db, [['o1', 'grafo', 'falla en src/hooks/use-toast.ts al resolver el callee']])

    expect(barrerObservaciones(db)).toBe(1)
    expect(barrerObservaciones(db)).toBe(0)
  })
})
