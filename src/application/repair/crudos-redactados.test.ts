import { describe, expect, it } from 'vitest'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { AnalystResult } from '@domain/repair/analysis'
import type { Proposal } from '@domain/repair/proposal'
import { evidenciaOmega } from './omega-autopsia'
import { recordAnalyzed } from './record-plan-events'

/** Lo que un agente deja en su salida si de paso corre `env`. */
const FUGA =
  'fallo al parsear\nGITHUB_TOKEN=ghp_abcdefghijklmnopqrst\nANTHROPIC_API_KEY=sk-ant-xyz123'

const libro = (): { log: never; eventos: ProposalEvent[] } => {
  const eventos: ProposalEvent[] = []
  const log = {
    record: (e: ProposalEvent) => (eventos.push(e), Promise.resolve()),
    list: () => Promise.resolve(eventos)
  } as unknown as never
  return { log, eventos }
}

// prettier-ignore
const resultado = (raw: string): AnalystResult => ({
  analysis: { target: {}, status: 'ILEGIBLE', risk: 'x' }, raw,
  runMeta: { tokensUsed: 1, durationMs: 1, startedAt: 1, endedAt: 2 }
} as unknown as AnalystResult)

describe('los crudos del agente se redactan ANTES de persistirse', () => {
  it('el del analista: va a evidence_json para siempre', async () => {
    // Lo efimero (la linea en vivo) ya se redactaba; lo PERMANENTE, no.
    const { log, eventos } = libro()
    await recordAnalyzed(log, { id: 'p1' } as Proposal, resultado(FUGA), { state: 'RECHAZADO', verdict: 'ILEGIBLE', reason: 'r' } as never) // prettier-ignore
    const crudo = eventos.map((e) => e.evidenceJson ?? '').join('')

    expect(crudo).not.toContain('ghp_abcdefghijklmnopqrst')
    expect(crudo).not.toContain('sk-ant-xyz123')
    expect(crudo).toContain('fallo al parsear')
  })

  it('el de OMEGA: mismo canal permanente, mismo trato', () => {
    const ev = JSON.stringify(evidenciaOmega({ ok: false, error: 'e', raw: FUGA } as never, []))

    expect(ev).not.toContain('ghp_abcdefghijklmnopqrst')
    expect(ev).toContain('fallo al parsear')
  })

  it('sin crudo no se inventa una cadena vacia: undefined sigue siendo undefined', () => {
    expect(evidenciaOmega({ ok: false, error: 'e' } as never, [])).toMatchObject({ raw: undefined })
  })
})
