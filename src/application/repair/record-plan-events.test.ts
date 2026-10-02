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
const KEY = 'sk-ant-api03-filtrada0123456789'

function libro(): { log: ProposalEventLog; events: ProposalEvent[] } {
  const events: ProposalEvent[] = []
  const log = { record: (e: ProposalEvent) => (events.push(e), Promise.resolve()) }
  return { log: log as ProposalEventLog, events }
}

function resultado(risk: string, marcador = 'llamada()'): AnalystResult {
  const analysis = { target: { id: 'f1', file: 'a.ts', title: 't', severity: 'LOW' }, status: 'DESCONOCIDO', whatToChange: `pon ${KEY}`, where: '', patternToCopy: '', doNotTouch: '', risk, evidencia: { marcador }, tokensUsed: 0 } as unknown as AnalystResult['analysis'] // prettier-ignore
  return { analysis, runMeta: META, raw: KEY }
}

async function transicionDe(r: AnalystResult): Promise<ProposalEvent | undefined> {
  const { log, events } = libro()
  await recordAnalyzed(log, PROPOSAL, r, veredictoDelAnalisis(r.analysis))
  return events.find((e) => e.eventType === 'TRANSITION')
}

describe('recordAnalyzed — la transicion se tacha igual que el crudo', () => {
  it('ilegible: la cola del crudo no llega en claro ni a la evidencia ni a la razon', async () => {
    const transicion = await transicionDe(resultado(`${ILEGIBLE}cola ${KEY}`))
    expect(transicion?.evidenceJson).not.toContain(KEY)
    expect(transicion?.reason).not.toContain(KEY)
    expect(transicion?.reason).toContain('cola')
  })

  it('la evidencia sigue siendo JSON legible con los campos limpios intactos', async () => {
    const transicion = await transicionDe(resultado('riesgo bajo', 'redactSecrets(raw)'))
    const evidencia = JSON.parse(transicion?.evidenceJson ?? '{}') as Record<string, unknown>
    expect(evidencia.risk).toBe('riesgo bajo')
    expect(evidencia.evidencia).toEqual({ marcador: 'redactSecrets(raw)' })
    expect(String(evidencia.whatToChange)).not.toContain(KEY)
  })

  it('solo se tacha la copia persistida: el analisis que decide queda literal', async () => {
    const r = resultado(`${ILEGIBLE}cola ${KEY}`)
    await transicionDe(r)
    expect(r.analysis.risk).toContain(KEY)
    expect(r.analysis.whatToChange).toContain(KEY)
  })
})
