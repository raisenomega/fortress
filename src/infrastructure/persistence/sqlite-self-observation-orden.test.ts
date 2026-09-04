import { describe, expect, it } from 'vitest'
import type { SelfObservationRepository } from '@domain/system/self-observation-repository'
import { createMemoryDb } from './memory-db'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'

const TANDA = '2026-09-04T02:10:00.000Z'

/** Una tanda: N observaciones cerradas EN EL MISMO INSTANTE, como pasa de verdad. */
function tanda(r: SelfObservationRepository, cuantas: number): void {
  for (let i = 0; i < cuantas; i += 1) {
    const o = r.add({ sourceProject: 'p', kind: 'gap', area: `a${i}`, note: 'n' })
    r.setStatus({ id: o.id, status: 'atendido', reason: 'x', attendedBy: 'y', attendedAt: TANDA })
  }
}

describe('el corte del tope con empates de tanda es determinista', () => {
  it('dos consultas iguales dan la MISMA lista, no una cualquiera', () => {
    // 117 se cerraron con el mismo attended_at el 4 de septiembre. Con la
    // recencia como unico criterio, el LIMIT cortaba por donde la base quisiera.
    const r = createSqliteSelfObservationRepository(createMemoryDb())
    tanda(r, 20)

    expect(r.listClosed(5).map((o) => o.id)).toEqual(r.listClosed(5).map((o) => o.id))
  })

  it('el tope se lleva un subconjunto del orden completo, no otro distinto', () => {
    const r = createSqliteSelfObservationRepository(createMemoryDb())
    tanda(r, 20)
    const cinco = r.listClosed(5).map((o) => o.id)

    const veinte = r.listClosed(20).map((o) => o.id)

    expect(cinco).toEqual(veinte.slice(0, 5))
  })
})

describe('y el orden sigue significando lo que dice', () => {
  it('la recencia del CIERRE manda por encima del desempate', () => {
    const r = createSqliteSelfObservationRepository(createMemoryDb())
    tanda(r, 3)
    const tarde = r.add({ sourceProject: 'p', kind: 'gap', area: 'la-ultima', note: 'n' })
    r.setStatus({ id: tarde.id, status: 'atendido', reason: 'x', attendedBy: 'y', attendedAt: '2026-09-05T00:00:00.000Z' }) // prettier-ignore

    expect(r.listClosed(40)[0].area).toBe('la-ultima')
  })

  it('dentro de la tanda, primero lo observado mas fresco', () => {
    // `add` pone la fecha del reloj y un bucle de cuatro cabe en un milisegundo:
    // con filas nacidas por el puerto este orden no se puede ni observar. Se
    // siembran a mano para que las fechas sean las del caso real, meses aparte.
    const db = createMemoryDb()
    const r = createSqliteSelfObservationRepository(db)
    const sql = `INSERT INTO self_observations
      (id, source_project, kind, area, note, resolved, created_at, status, reason, attended_by, attended_at)
      VALUES (?, 'p', 'gap', ?, 'n', 0, ?, 'atendido', 'x', 'y', ?)`
    // prettier-ignore
    const nacimientos = [['vieja', '2026-03-01'], ['nueva', '2026-08-01'], ['media', '2026-06-01']]
    for (const [id, nacio] of nacimientos) db.prepare(sql).run(id, id, nacio, TANDA)

    expect(r.listClosed(40).map((o) => o.area)).toEqual(['nueva', 'media', 'vieja'])
  })
})
