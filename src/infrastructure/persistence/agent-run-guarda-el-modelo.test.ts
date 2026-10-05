import { describe, expect, it } from 'vitest'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteAgentRunRepository } from './sqlite-agent-run-repository'

/** ADR-078 (enmienda 2026-10-05): cada corrida guarda el modelo que DE VERDAD
 *  corrio. La noche del 05-oct no habia donde mirarlo: se supo por una sonda. */
const base = { projectId: 'p1', agentId: null, kind: 'repair' as const, tools: [], durationMs: 1, failed: false }

describe('la corrida guarda el modelo real', () => {
  it('se asienta con su modelo y se lee igual', () => {
    const db = createMemoryDb()
    seedProject(db, 'p1')
    const fila = createSqliteAgentRunRepository(db).record({ ...base, modelo: 'claude-opus-5-5' })
    expect(fila.modelo).toBe('claude-opus-5-5')
  })

  it('sin modelo conocido → ausente, no una cadena inventada', () => {
    const db = createMemoryDb()
    seedProject(db, 'p1')
    expect(createSqliteAgentRunRepository(db).record(base).modelo).toBeUndefined()
  })
})
