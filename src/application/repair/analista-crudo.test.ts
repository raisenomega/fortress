import { describe, expect, it } from 'vitest'
import type { AnalystResult } from '@domain/repair/analysis'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { Proposal } from '@domain/repair/proposal'
import { ILEGIBLE } from '@domain/repair/analysis-ilegible'
import { recordAnalyzed } from './record-plan-events'
import type { ProposalEventLog } from './proposal-event-log'

const PROPOSAL = { id: 'prop-1', projectId: 'p1', findingId: 'f1', baseSha: 'base', state: 'ELEGIDO', createdAt: 1, updatedAt: 1 } as Proposal // prettier-ignore
const META = { durationMs: 1, startedAt: 1, endedAt: 2 }
const CRUDO = `${'el analista razono largo antes de cerrar mal el bloque. '.repeat(60)}]`

function libro(): { log: ProposalEventLog; events: ProposalEvent[] } {
  const events: ProposalEvent[] = []
  const log = { record: (e: ProposalEvent) => (events.push(e), Promise.resolve()) }
  return { log: log as ProposalEventLog, events }
}

function resultado(extra: Partial<AnalystResult>): AnalystResult {
  const analysis = { target: { id: 'f1', file: 'a.ts', title: 't', severity: 'LOW' }, status: 'DESCONOCIDO', whatToChange: '', where: '', patternToCopy: '', doNotTouch: '', risk: `${ILEGIBLE}muestra`, tokensUsed: 0 } as unknown as AnalystResult['analysis'] // prettier-ignore
  return { analysis, runMeta: META, ...extra }
}

describe('recordAnalyzed — el crudo del analista se conserva entero', () => {
  it('con crudo: viaja ENTERO en la evidencia del evento de la corrida', async () => {
    const { log, events } = libro()
    await recordAnalyzed(log, PROPOSAL, resultado({ raw: CRUDO }), 'CADUCADO')
    const corrida = events.find((e) => e.eventType === 'AGENT_RUN')
    const evidencia = JSON.parse(corrida?.evidenceJson ?? '{}') as Record<string, unknown>
    expect(evidencia.raw).toBe(CRUDO)
    expect(String(evidencia.raw).length).toBeGreaterThan(3000)
  })

  it('la razon del asiento sigue siendo la muestra legible, no el crudo', async () => {
    const { log, events } = libro()
    await recordAnalyzed(log, PROPOSAL, resultado({ raw: CRUDO }), 'CADUCADO')
    const transicion = events.find((e) => e.eventType === 'TRANSITION')
    expect(transicion?.reason).toBe(`${ILEGIBLE}muestra`)
    expect(transicion?.reason).not.toContain(CRUDO)
  })

  it('sin crudo (analisis legible): la corrida no inventa evidencia', async () => {
    const { log, events } = libro()
    await recordAnalyzed(log, PROPOSAL, resultado({}), 'ANALIZADO')
    expect(events.find((e) => e.eventType === 'AGENT_RUN')?.evidenceJson).toBeUndefined()
  })
})
