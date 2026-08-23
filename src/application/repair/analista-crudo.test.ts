import { describe, expect, it } from 'vitest'
import type { AnalystResult } from '@domain/repair/analysis'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { Proposal } from '@domain/repair/proposal'
import { ILEGIBLE } from '@domain/repair/analysis-ilegible'
import { veredictoDelAnalisis } from '@domain/repair/veredicto-del-analisis'
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

function resultado(extra: Partial<AnalystResult>, risk = `${ILEGIBLE}muestra`): AnalystResult {
  const analysis = { target: { id: 'f1', file: 'a.ts', title: 't', severity: 'LOW' }, status: 'DESCONOCIDO', whatToChange: '', where: '', patternToCopy: '', doNotTouch: '', risk, tokensUsed: 0 } as unknown as AnalystResult['analysis'] // prettier-ignore
  return { analysis, runMeta: META, ...extra }
}

const veredictoDe = (r: AnalystResult): ReturnType<typeof veredictoDelAnalisis> =>
  veredictoDelAnalisis(r.analysis)

describe('recordAnalyzed — el crudo del analista se conserva entero', () => {
  it('con crudo: viaja ENTERO en la evidencia del evento de la corrida', async () => {
    const { log, events } = libro()
    const r = resultado({ raw: CRUDO })
    await recordAnalyzed(log, PROPOSAL, r, veredictoDe(r))
    const corrida = events.find((e) => e.eventType === 'AGENT_RUN')
    const evidencia = JSON.parse(corrida?.evidenceJson ?? '{}') as Record<string, unknown>
    expect(evidencia.raw).toBe(CRUDO)
    expect(String(evidencia.raw).length).toBeGreaterThan(3000)
  })

  it('la razon del asiento lleva la muestra legible, no el crudo', async () => {
    const { log, events } = libro()
    const r = resultado({ raw: CRUDO })
    await recordAnalyzed(log, PROPOSAL, r, veredictoDe(r))
    const transicion = events.find((e) => e.eventType === 'TRANSITION')
    expect(transicion?.reason).toBe('analisis_ilegible: muestra')
    expect(transicion?.reason).not.toContain(CRUDO)
  })

  it('el asiento de un ilegible NO dice caducado ni se archiva bajo EXPIRE', async () => {
    // Era 'CADUCADO' en fase EXPIRE: el Libro afirmaba que el hallazgo se fue.
    const { log, events } = libro()
    const r = resultado({ raw: CRUDO })
    await recordAnalyzed(log, PROPOSAL, r, veredictoDe(r))
    const transicion = events.find((e) => e.eventType === 'TRANSITION')
    expect(transicion?.toState).toBe('RECHAZADO')
    expect(transicion?.phase).toBe('ANALYZE')
  })

  it('un obsoleto de verdad sigue caducando en EXPIRE', async () => {
    const { log, events } = libro()
    const r = resultado({}, 'el fichero ya no tiene esa llamada')
    await recordAnalyzed(log, PROPOSAL, r, veredictoDe(r))
    const transicion = events.find((e) => e.eventType === 'TRANSITION')
    expect([transicion?.toState, transicion?.phase]).toEqual(['CADUCADO', 'EXPIRE'])
  })

  it('sin crudo (analisis legible): la corrida no inventa evidencia', async () => {
    const { log, events } = libro()
    const r = resultado({}, 'riesgo bajo')
    await recordAnalyzed(log, PROPOSAL, r, veredictoDe(r))
    expect(events.find((e) => e.eventType === 'AGENT_RUN')?.evidenceJson).toBeUndefined()
  })
})
