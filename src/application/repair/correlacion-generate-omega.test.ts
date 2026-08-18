import { describe, expect, it } from 'vitest'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import { bench } from './generate-fix-fixture'
import { generateFix } from './generate-fix'

/** El asiento de la corrida de una fase: el que cita al libro mayor. */
type Asiento = { agentRunId?: string; costTokens?: number; durationMs?: number }

const corrida = (b: { readonly events: readonly ProposalEvent[] }, phase: string): Asiento =>
  (b.events.find((e) => e.phase === phase && e.eventType === 'AGENT_RUN') ?? {}) as Asiento

describe('la corrida del generador se puede cruzar con el libro mayor', () => {
  it('el asiento de GENERATE cita el id de su corrida', async () => {
    const b = bench()
    await generateFix(b.context, 'prop-1', b.deps)

    expect(corrida(b, 'GENERATE').agentRunId).toBe('run-gen')
  })

  it('una generacion fallida tambien se cita: gasto tuvo', async () => {
    const b = bench({ generatorFails: true })
    await generateFix(b.context, 'prop-1', b.deps)

    expect(corrida(b, 'GENERATE').agentRunId).toBe('run-gen')
  })

  it('sin libro mayor que responda, el asiento queda sin cita en vez de con una falsa', async () => {
    const b = bench()
    const roto = { ...b.context, runs: { record: () => { throw new Error('base caida') } } } as unknown as typeof b.context // prettier-ignore
    await generateFix(roto, 'prop-1', b.deps)

    expect(corrida(b, 'GENERATE').agentRunId).toBeUndefined()
  })

  it('el resto del asiento no cambia: solo se anade la cita', async () => {
    const b = bench()
    await generateFix(b.context, 'prop-1', b.deps)

    expect(corrida(b, 'GENERATE')).toMatchObject({ costTokens: 50_000, durationMs: 9 })
  })
})
