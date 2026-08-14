import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import { VIEJO } from './expand-agent-runs-fixture'
import { expandAgentRunsKind } from './expand-agent-runs-kind'

let db: Database.Database
const insertar = (kind: string): void =>
  void db.prepare('INSERT INTO agent_runs (id, project_id, kind, at) VALUES (?, ?, ?, ?)').run(`x-${kind}`, 'p1', kind, '2026-08-14') // prettier-ignore

beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(VIEJO)
})

describe('expandAgentRunsKind: recrear la tabla sin perder una fila', () => {
  it('conserva las filas y sus datos', () => {
    expandAgentRunsKind(db)

    const filas = db.prepare('SELECT id, kind, cost_usd FROM agent_runs ORDER BY id').all()
    expect(filas).toEqual([
      { id: 'r1', kind: 'chat', cost_usd: 1.5 },
      { id: 'r2', kind: 'scan', cost_usd: 3.25 }
    ])
  })

  it('el CHECK admite repair y sigue rechazando lo que no existe', () => {
    expandAgentRunsKind(db)

    expect(() => insertar('repair')).not.toThrow()
    expect(() => insertar('cualquiera')).toThrow()
  })

  it('los indices sobreviven al recambio', () => {
    expandAgentRunsKind(db)

    const sql = 'SELECT name FROM sqlite_master WHERE type = ? AND tbl_name = ?'
    const idx = db.prepare(sql).all('index', 'agent_runs') as { name: string }[]
    expect(idx.map((i) => i.name)).toEqual(
      expect.arrayContaining(['idx_runs_project', 'idx_runs_agent'])
    )
  })

  it('correrla dos veces no toca nada la segunda', () => {
    expandAgentRunsKind(db)
    insertar('repair')
    expandAgentRunsKind(db)

    expect(db.prepare('SELECT COUNT(*) c FROM agent_runs').get()).toEqual({ c: 3 })
  })

  it('deja las claves foraneas encendidas y sin violaciones', () => {
    // El PRAGMA se apaga durante el recambio; si no se restaura, el siguiente
    // borrado de proyecto dejaria telemetria huerfana contando tokens.
    expandAgentRunsKind(db)

    expect(db.pragma('foreign_keys', { simple: true })).toBe(1)
    expect(db.pragma('foreign_key_check', { simple: true })).toBeUndefined()
  })
})
