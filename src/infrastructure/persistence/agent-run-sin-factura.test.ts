import { describe, expect, it } from 'vitest'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteAgentRunRepository } from './sqlite-agent-run-repository'

const FACTURA = { ...EMPTY_USAGE, outputTokens: 900, costUsd: 3.26, numTurns: 12 }

function banco(): ReturnType<typeof createSqliteAgentRunRepository> {
  const db = createMemoryDb()
  seedProject(db, 'p1')
  return createSqliteAgentRunRepository(db)
}

const base = { projectId: 'p1', agentId: null, kind: 'repair' as const, tools: [] }

describe('una corrida sin factura deja fila, y la fila dice que no la hubo', () => {
  it('se asienta con la bandera en falso y la duracion REAL', () => {
    // Los quince minutos ocurrieron: son el unico dato cuantitativo cierto de
    // una corrida que murio antes de que el CLI enviara su factura.
    const runs = banco()
    const fila = runs.record({ ...base, durationMs: 900_018, failed: true })

    expect(fila.usageKnown).toBe(false)
    expect(fila.durationMs).toBe(900_018)
  })

  it('sus contadores en cero significan "no se", no "gratis"', () => {
    const runs = banco()
    const fila = runs.record({ ...base, durationMs: 900_018, failed: true })

    expect(fila.usage.costUsd).toBe(0)
    expect(fila.usageKnown).toBe(false)
  })

  it('una corrida CON factura queda marcada como medida', () => {
    const runs = banco()
    const fila = runs.record({ ...base, durationMs: 205_000, failed: false, usage: FACTURA })

    expect(fila.usageKnown).toBe(true)
    expect(fila.usage.costUsd).toBe(3.26)
  })
})

describe('sinFacturaSince: lo que ocurrio y no se pudo medir', () => {
  it('cuenta las corridas y suma su tiempo, sin inventar el dinero', () => {
    const runs = banco()
    runs.record({ ...base, durationMs: 900_018, failed: true })
    runs.record({ ...base, durationMs: 900_100, failed: true })
    runs.record({ ...base, durationMs: 205_000, failed: false, usage: FACTURA })

    expect(runs.sinFacturaSince('2000-01-01T00:00:00Z')).toEqual({
      runs: 2,
      durationMs: 1_800_118
    })
  })

  it('sin ninguna sin medir devuelve cero corridas, no null', () => {
    const runs = banco()
    runs.record({ ...base, durationMs: 205_000, failed: false, usage: FACTURA })

    expect(runs.sinFacturaSince('2000-01-01T00:00:00Z')).toEqual({ runs: 0, durationMs: 0 })
  })
})
