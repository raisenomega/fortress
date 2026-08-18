import { describe, expect, it } from 'vitest'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import { bench as benchOmega } from './run-omega-fixture'
import { runOmega } from './run-omega'

type Asiento = { agentRunId?: string; costTokens?: number; durationMs?: number }

const corrida = (b: { readonly events: readonly ProposalEvent[] }, phase: string): Asiento =>
  (b.events.find((e) => e.phase === phase && e.eventType === 'AGENT_RUN') ?? {}) as Asiento

describe('la corrida del revisor tambien se puede cruzar', () => {
  it('el asiento de OMEGA cita el id de su corrida', async () => {
    // Su asiento ni siquiera reservaba el hueco: no citaba nada.
    const b = benchOmega()
    await runOmega(b.context, 'prop-1', b.deps)

    expect(corrida(b, 'OMEGA').agentRunId).toBe('run-omega')
  })

  it('el resto del asiento de OMEGA no cambia', async () => {
    const b = benchOmega()
    await runOmega(b.context, 'prop-1', b.deps)

    expect(corrida(b, 'OMEGA')).toMatchObject({ costTokens: 120_000, durationMs: 60_000 })
  })
})
