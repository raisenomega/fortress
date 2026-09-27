import { describe, expect, it } from 'vitest'
import { asentarIntentoFallido } from '@application/scan/asentar-intento-fallido'
import type { AppContext } from '@application/context'
import type { IntentoFallido } from '@domain/scan/intento-fallido'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteProjectRepository } from './sqlite-project-repository'
import { createSqliteAgentRunRepository } from './sqlite-agent-run-repository'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'

const SIN_FACTURA = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, costUsd: 0, numTurns: 0 } // prettier-ignore

function banco(): { context: AppContext; notas: () => readonly { area: string }[] } {
  const db = createMemoryDb()
  seedProject(db, 'p1')
  const repo = createSqliteSelfObservationRepository(db)
  const context = {
    projects: createSqliteProjectRepository(db),
    runs: createSqliteAgentRunRepository(db),
    selfObservations: repo,
    transaction: (work: () => void) => db.transaction(work)()
  } as unknown as AppContext
  return { context, notas: () => repo.listOpen() }
}

const intento = (notas: IntentoFallido['notas']): IntentoFallido => ({
  projectId: 'p1',
  motivo: 'informe-ilegible',
  durationMs: 900_000,
  usage: SIN_FACTURA,
  tools: [],
  texto: '',
  notas
})

describe('el intento que no llego a informe ASIENTA lo que el agente noto', () => {
  it('la nota entra al backlog aunque el informe se tirara entero', () => {
    const b = banco()

    asentarIntentoFallido(b.context, intento([{ kind: 'limitacion', area: 'consulta-del-grafo', note: 'no da politicas SQL' }])) // prettier-ignore

    expect(b.notas()).toHaveLength(1)
    expect(b.notas()[0].area).toBe('consulta-del-grafo')
  })

  it('sin notas no escribe ninguna fila, y la factura entra igual', () => {
    const b = banco()

    asentarIntentoFallido(b.context, intento([]))

    expect(b.notas()).toHaveLength(0)
  })
})
