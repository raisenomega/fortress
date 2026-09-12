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

describe('el re-barrido de las rutas absolutas (2026-09-11, tras medir)', () => {
  it('las 40 que sobrevivieron al primer barrido quedan redactadas', () => {
    // Verbatim de la base del operador DESPUES del arranque de las 16:12: el
    // cerco de entonces tajaba citas y rutas relativas, pero una ruta absoluta
    // que termina en directorio no la alcanzaba ninguna de sus tres reglas.
    const db = createMemoryDb()
    sembrarSinCerco(db, [
      ['o1', 'indice del grafo', 'el repo de trabajo /home/jojo/Escritorio/Raisen_FCC/fortress-command-center NO esta indexado'] // prettier-ignore
    ])

    expect(barrerObservaciones(db)).toBe(1)

    const [nota] = leer(db)
    expect(nota.note).not.toContain('/home/jojo')
    expect(nota.note).toContain(RUTA_REDACTADA)
    // Y el `NO` sobrevive: sin el, la nota diria lo contrario de lo que dice.
    expect(nota.note).toContain('NO esta indexado')
  })

  it('y la de un CLIENTE con espacios, que es el hueco de verdad', () => {
    const db = createMemoryDb()
    sembrarSinCerco(db, [['o1', 'grafo', 'el repo /media/disco/Cliente ACME no esta indexado']])

    barrerObservaciones(db)

    const [nota] = leer(db)
    expect(nota.note).not.toContain('ACME')
    expect(nota.note).toBe(`el repo ${RUTA_REDACTADA} no esta indexado`)
  })

  it('sigue siendo idempotente tras la regla nueva', () => {
    const db = createMemoryDb()
    sembrarSinCerco(db, [['o1', 'grafo', 'fallo en /home/ana/proyecto al leer']])

    expect(barrerObservaciones(db)).toBe(1)
    expect(barrerObservaciones(db)).toBe(0)
  })
})
