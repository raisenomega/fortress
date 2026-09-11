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

describe('el recambio es REPETIBLE: copia por nombre, no por posicion', () => {
  it('el ALTER primero y el recambio despues: dieciseis columnas y sus dos filas', () => {
    addAgentRunColumns(db)
    expandAgentRunsKind(db)

    expect(columnas()).toContain('usage_known')
    expect(db.prepare('SELECT COUNT(*) c FROM agent_runs').get()).toEqual({ c: 2 })
  })

  it('y al reves TAMBIEN, que es lo que arreglo el segundo recambio', () => {
    // Antes esto reventaba: `INSERT ... SELECT *` exigia el mismo numero de
    // columnas, asi que una base con la bandera ya puesta metia dieciseis
    // valores en quince huecos y NO ABRIA. Eso hacia el recambio de un solo
    // uso, y el segundo —el que anadio `sistema`— habria tumbado la app de
    // cualquier operador con version de hoy.
    addAgentRunColumns(db)

    expect(() => expandAgentRunsKind(db)).not.toThrow()
    expect(db.prepare('SELECT COUNT(*) c FROM agent_runs').get()).toEqual({ c: 2 })
  })

  it('una base vieja sin la bandera la estrena en NULL, que es lo que significa', () => {
    expandAgentRunsKind(db)

    expect(columnas()).toContain('usage_known')
    expect(db.prepare('SELECT usage_known FROM agent_runs WHERE id = ?').get('r1')).toEqual({
      usage_known: null
    })
  })

  it('una base YA migrada no se recrea: el guard corta antes', () => {
    expandAgentRunsKind(db)
    addAgentRunColumns(db)
    expandAgentRunsKind(db)

    expect(columnas()).toContain('usage_known')
  })
})
