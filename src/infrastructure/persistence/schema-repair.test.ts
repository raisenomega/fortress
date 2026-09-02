import { describe, expect, it } from 'vitest'
import { createMemoryDb, seedProject } from './memory-db'
import { REPAIR_SCHEMA } from './schema-repair'

describe('REPAIR_SCHEMA', () => {
  it('es idempotente: aplicarlo dos veces no rompe ni duplica', () => {
    const db = createMemoryDb() // ya lo aplico una vez
    seedProject(db, 'p1') // la propuesta cuelga de su proyecto
    expect(() => db.exec(REPAIR_SCHEMA)).not.toThrow()

    db.prepare(
      `INSERT INTO repair_proposals (id, project_id, finding_id, base_sha, state, created_at, updated_at)
       VALUES ('r1', 'p1', 'f1', 'sha', 'ELEGIDO', 1, 1)`
    ).run()
    db.exec(REPAIR_SCHEMA) // re-aplicar con datos tampoco los toca
    const total = db.prepare('SELECT COUNT(*) AS n FROM repair_proposals').get() as { n: number }
    expect(total.n).toBe(1)
  })

  it('el indice unico impide duplicar (proyecto, hallazgo, momento)', () => {
    const db = createMemoryDb()
    seedProject(db, 'p1')
    const insert = db.prepare(
      `INSERT INTO repair_proposals (id, project_id, finding_id, base_sha, state, created_at, updated_at)
       VALUES (?, 'p1', 'f1', 'sha', 'ELEGIDO', 7, 7)`
    )
    insert.run('r1')
    expect(() => insert.run('r2')).toThrow(/UNIQUE/)
  })
})
