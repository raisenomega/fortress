import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { addAgentRunColumns } from './add-agent-run-columns'
import { expandAgentRunsKind } from './expand-agent-runs-kind'
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

describe('el orden importa: el ALTER va DESPUES del recambio de la tabla', () => {
  it('recambio y luego ALTER: la base queda con las dieciseis columnas', () => {
    expandAgentRunsKind(db)
    addAgentRunColumns(db)

    expect(columnas()).toContain('usage_known')
    expect(db.prepare('SELECT COUNT(*) c FROM agent_runs').get()).toEqual({ c: 2 })
  })

  it('al reves REVIENTA, y por eso el orden esta fijado aqui', () => {
    // `expandAgentRunsKind` copia con INSERT ... SELECT *, que exige el mismo
    // numero de columnas en las dos tablas. Con la bandera puesta antes, la
    // vieja tendria dieciseis y la nueva quince: quince valores para dieciseis
    // huecos. Una base de un operador con version anterior no abriria.
    addAgentRunColumns(db)
    expect(() => expandAgentRunsKind(db)).toThrow()
  })

  it('una base YA migrada no se recrea: el guard corta antes', () => {
    expandAgentRunsKind(db)
    addAgentRunColumns(db)
    expandAgentRunsKind(db)

    expect(columnas()).toContain('usage_known')
  })
})
