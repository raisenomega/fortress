import { describe, expect, it } from 'vitest'
import { buildAgentRunEvent, buildTransitionEvent } from './proposal-event'

describe('buildTransitionEvent', () => {
  it('fabrica un TRANSITION consistente, siempre del motor', () => {
    const event = buildTransitionEvent({
      proposalId: 'p1', seq: 1, phase: 'SELECT', toState: 'ELEGIDO', scanId: 's1', ts: 100
    }) // prettier-ignore

    expect(event).toMatchObject({
      proposalId: 'p1', seq: 1, phase: 'SELECT', eventType: 'TRANSITION',
      toState: 'ELEGIDO', actor: 'motor', scanId: 's1', ts: 100
    }) // prettier-ignore
    expect(event.id).toBeTruthy()
    expect(event.fromState).toBeUndefined()
  })

  it('lleva fromState y razon cuando la transicion los tiene', () => {
    const event = buildTransitionEvent({
      proposalId: 'p1', seq: 3, phase: 'EXPIRE', fromState: 'ELEGIDO', toState: 'CADUCADO',
      reason: 'obsoleto', evidenceJson: '{"x":1}', ts: 300
    }) // prettier-ignore
    expect(event.fromState).toBe('ELEGIDO')
    expect(event.reason).toBe('obsoleto')
    expect(event.evidenceJson).toBe('{"x":1}')
  })
})

describe('buildAgentRunEvent', () => {
  it('fabrica un AGENT_RUN con coste y duracion cuando se conocen', () => {
    const event = buildAgentRunEvent({
      proposalId: 'p1', seq: 2, phase: 'ANALYZE', actor: 'claude-analyst',
      costTokens: 1234, durationMs: 105000, ts: 200
    }) // prettier-ignore
    expect(event).toMatchObject({ eventType: 'AGENT_RUN', actor: 'claude-analyst', costTokens: 1234, durationMs: 105000 }) // prettier-ignore
  })

  it('sin coste conocido, los campos quedan undefined: no se inventan numeros', () => {
    const event = buildAgentRunEvent({ proposalId: 'p1', seq: 2, phase: 'ANALYZE', actor: 'claude-analyst', ts: 200 }) // prettier-ignore
    expect(event.costTokens).toBeUndefined()
    expect(event.durationMs).toBeUndefined()
  })

  it('la cadena conserva el orden temporal que le den (ts monotona)', () => {
    const a = buildTransitionEvent({ proposalId: 'p1', seq: 1, phase: 'SELECT', toState: 'ELEGIDO', ts: 100 }) // prettier-ignore
    const b = buildAgentRunEvent({ proposalId: 'p1', seq: 2, phase: 'ANALYZE', actor: 'claude-analyst', ts: 250 }) // prettier-ignore
    expect(b.ts).toBeGreaterThan(a.ts)
    expect(b.seq).toBeGreaterThan(a.seq)
  })
})
