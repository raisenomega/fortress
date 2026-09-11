import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { addAgentRunColumns } from './add-agent-run-columns'
import { VIEJO } from './expand-agent-runs-fixture'

let db: Database.Database
const columnas = (): string[] =>
  (db.pragma('table_info(agent_runs)') as { name: string }[]).map((c) => c.name)

beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(VIEJO)
})

describe('usage_known: la bandera que hacia falta, sin tocar los contadores', () => {
  it('la anade, y correr dos veces no falla', () => {
    addAgentRunColumns(db)
    addAgentRunColumns(db)

    expect(columnas()).toContain('usage_known')
  })

  it('las filas que ya existian quedan en NULL: no se rellenan hacia atras', () => {
    // Clasificarlas seria inferir, y las que estan a cero son justamente las
    // que no se pueden clasificar sin adivinar si fue gratis o no se midio.
    addAgentRunColumns(db)

    const filas = db.prepare('SELECT id, usage_known FROM agent_runs ORDER BY id').all()
    expect(filas).toEqual([
      { id: 'r1', usage_known: null },
      { id: 'r2', usage_known: null }
    ])
  })

  it('los cuatro contadores siguen intactos: la migracion no los toca', () => {
    addAgentRunColumns(db)
    expect(columnas()).toEqual(
      expect.arrayContaining(['input_tokens', 'output_tokens', 'cache_read_tokens', 'cost_usd'])
    )
  })
})
