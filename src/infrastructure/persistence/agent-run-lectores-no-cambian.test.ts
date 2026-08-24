import { describe, expect, it } from 'vitest'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteAgentRunRepository } from './sqlite-agent-run-repository'

const FACTURA = { ...EMPTY_USAGE, outputTokens: 900, costUsd: 4, numTurns: 12 }
const base = { projectId: 'p1', agentId: null, kind: 'repair' as const, tools: [] }

function banco(): ReturnType<typeof createSqliteAgentRunRepository> {
  const db = createMemoryDb()
  seedProject(db, 'p1')
  return createSqliteAgentRunRepository(db)
}

/**
 * El Incremento 1 solo deja de perder el dato. Que los lectores del gasto lo
 * DIGAN es el siguiente, y hasta entonces tienen que dar exactamente lo mismo
 * que antes: una fila sin factura suma cero, que es lo unico que puede sumar.
 */
describe('los lectores del gasto no cambian todavia', () => {
  it('el total del dia suma solo lo medido, ni mas ni menos', () => {
    const runs = banco()
    runs.record({ ...base, durationMs: 205_000, failed: false, usage: FACTURA })
    runs.record({ ...base, durationMs: 900_018, failed: true })

    expect(runs.usageSince('2000-01-01T00:00:00Z').costUsd).toBe(4)
  })

  it('la media por corrida sigue ignorando las fallidas, como siempre', () => {
    const runs = banco()
    runs.record({ ...base, durationMs: 10_000, failed: false, usage: { ...FACTURA, costUsd: 6 } })
    runs.record({ ...base, durationMs: 900_018, failed: true })

    expect(runs.averageRun('p1')).toEqual({ usd: 6, seconds: 10 })
  })

  it('pero el episodio ya no es invisible: ocurrio y se cuenta', () => {
    // Antes de esta pieza la corrida no dejaba fila, asi que el recuento de
    // episodios tampoco la veia. Quince minutos que no le constaban a nadie.
    const runs = banco()
    runs.record({ ...base, durationMs: 900_018, failed: true })

    expect(runs.episodeTallySince('2000-01-01T00:00:00Z')).toEqual({ episodes: 1, failures: 1 })
  })
})
