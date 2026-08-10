import { describe, expect, it } from 'vitest'
import { bench, cmd } from './run-gate-fixture'
import { runGate } from './run-gate'

describe('runGate (I3)', () => {
  it('gate verde: GENERADO -> GATE, 4 AGENT_RUN + 1 TRANSITION en el libro', async () => {
    const b = bench()
    expect(await runGate(b.context, 'prop-1', b.deps)).toEqual({ ok: true })
    expect(b.patches.at(-1)).toMatchObject({ state: 'GATE' })

    const runs = b.events.filter((e) => e.eventType === 'AGENT_RUN' && e.phase === 'GATE')
    expect(runs.map((e) => e.reason)).toEqual(['npm ci', 'typecheck', 'lint', 'test:unit'])
    expect(runs.every((e) => e.costTokens === undefined)).toBe(true)
    expect(b.events.at(-1)).toMatchObject({ eventType: 'TRANSITION', toState: 'GATE', fromState: 'GENERADO' }) // prettier-ignore
  })

  it('test:unit rojo: RECHAZADO con gate_failed_at=test:unit, worktree intacto', async () => {
    const b = bench({
      outcome: { ok: false, commands: [cmd('npm ci'), cmd('typecheck'), cmd('lint'), cmd('test:unit', 1)], failedAt: 'test:unit', reason: 'gate_failed' } // prettier-ignore
    })
    expect(await runGate(b.context, 'prop-1', b.deps)).toEqual({ ok: false, reason: 'gate_failed' }) // prettier-ignore
    expect(b.patches.at(-1)).toMatchObject({ state: 'RECHAZADO', analysisReason: 'gate_failed_at=test:unit' }) // prettier-ignore
  })

  it('timeout: RECHAZADO gate_timeout con timedOut en la evidencia', async () => {
    const b = bench({
      outcome: { ok: false, commands: [cmd('npm ci'), cmd('typecheck', 1, true)], failedAt: 'typecheck', reason: 'gate_timeout' } // prettier-ignore
    })
    expect(await runGate(b.context, 'prop-1', b.deps)).toEqual({ ok: false, reason: 'gate_timeout' }) // prettier-ignore
    const cierre = b.events.at(-1)
    expect(JSON.parse(cierre?.evidenceJson ?? '{}')).toMatchObject({ timedOut: true })
  })

  it('sin worktree: RECHAZADO worktree_missing sin correr nada', async () => {
    const b = bench({ worktreeExists: false })
    expect(await runGate(b.context, 'prop-1', b.deps)).toEqual({ ok: false, reason: 'worktree_missing' }) // prettier-ignore
    expect(b.events.filter((e) => e.eventType === 'AGENT_RUN')).toHaveLength(0)
  })

  it('worktree sucio: RECHAZADO worktree_contaminated', async () => {
    const b = bench({ clean: false })
    expect(await runGate(b.context, 'prop-1', b.deps)).toEqual({ ok: false, reason: 'worktree_contaminated' }) // prettier-ignore
  })

  it('estado invalido: no muta nada', async () => {
    const b = bench({ state: 'GATE' })
    expect(await runGate(b.context, 'prop-1', b.deps)).toEqual({
      ok: false,
      reason: 'invalid_state'
    })
    expect(b.patches).toEqual([])
    expect(b.events).toEqual([])
  })
})
