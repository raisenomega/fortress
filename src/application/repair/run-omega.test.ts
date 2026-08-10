import { describe, expect, it } from 'vitest'
import { APROBADO, bench } from './run-omega-fixture'
import { runOmega } from './run-omega'

const META = { tokensUsed: 120_000, durationMs: 1, startedAt: 1, endedAt: 2 }

describe('runOmega (I4) — guardas', () => {
  it('APROBADO: GATE -> OMEGA con AGENT_RUN + TRANSITION en el libro', async () => {
    const b = bench()
    const result = await runOmega(b.context, 'prop-1', b.deps)
    expect(result.ok).toBe(true)
    expect(b.patches.at(-1)).toMatchObject({ state: 'OMEGA' })
    expect(b.patches.at(-1)?.analysisReason).toContain('omega_aprobado')
    const tipos = b.events.map((e) => [e.eventType, e.phase])
    expect(tipos).toEqual([['AGENT_RUN', 'OMEGA'], ['TRANSITION', 'OMEGA']]) // prettier-ignore
    expect(b.events.at(-1)).toMatchObject({ fromState: 'GATE', toState: 'OMEGA' })
  })

  it('VETADO por resuelve=NO: GATE -> RECHAZADO omega_vetado, worktree intacto', async () => {
    const b = bench({ result: { ok: true, verdict: { ...APROBADO, resuelve_el_hallazgo: 'NO', veredicto_global: 'VETADO' }, runMeta: META } }) // prettier-ignore
    expect(await runOmega(b.context, 'prop-1', b.deps)).toMatchObject({ ok: false, reason: 'omega_vetado' }) // prettier-ignore
    expect(b.patches.at(-1)?.analysisReason).toContain('omega_vetado')
  })

  it('agente dice APROBADO pero las reglas dicen VETADO: mismatch + motor manda', async () => {
    const b = bench({ result: { ok: true, verdict: { ...APROBADO, respeta_scope: 'NO' }, runMeta: META } }) // prettier-ignore
    expect(await runOmega(b.context, 'prop-1', b.deps)).toMatchObject({ ok: false, reason: 'omega_vetado' }) // prettier-ignore
    const mismatch = b.events.find((e) => e.reason === 'omega_verdict_mismatch')
    expect(mismatch?.eventType).toBe('DECISION')
    expect(JSON.parse(mismatch?.evidenceJson ?? '{}')).toEqual({ agentSaid: 'APROBADO', rulesSay: 'VETADO' }) // prettier-ignore
  })

  it('sin margen pre-spawn: RECHAZADO budget_exceeded sin correr OMEGA', async () => {
    const b = bench({ spentPrevio: 1_800_000 })
    expect(await runOmega(b.context, 'prop-1', b.deps)).toMatchObject({ ok: false, reason: 'budget_exceeded' }) // prettier-ignore
    expect(b.calls).toEqual([])
  })
})

describe('runOmega (I4) — fallos del agente', () => {
  it('timeout: RECHAZADO omega_timeout, worktree conservado', async () => {
    const b = bench({ result: { ok: false, error: 'timeout', timedOut: true, runMeta: META } })
    expect(await runOmega(b.context, 'prop-1', b.deps)).toMatchObject({ ok: false, reason: 'omega_timeout' }) // prettier-ignore
  })

  it('respuesta invalida: RECHAZADO omega_response_invalid', async () => {
    const b = bench({ result: { ok: false, error: 'omega_response_invalid', timedOut: false, runMeta: META } }) // prettier-ignore
    expect(await runOmega(b.context, 'prop-1', b.deps)).toMatchObject({ ok: false, reason: 'omega_response_invalid' }) // prettier-ignore
  })

  it('sin worktree: RECHAZADO worktree_missing sin spawnear', async () => {
    const b = bench({ worktreeExists: false })
    expect(await runOmega(b.context, 'prop-1', b.deps)).toMatchObject({ ok: false, reason: 'worktree_missing' }) // prettier-ignore
    expect(b.calls).toEqual([])
  })

  it('estado invalido: no muta nada', async () => {
    const b = bench({ state: 'OMEGA' })
    expect(await runOmega(b.context, 'prop-1', b.deps)).toEqual({ ok: false, reason: 'invalid_state' }) // prettier-ignore
    expect(b.patches).toEqual([])
    expect(b.events).toEqual([])
  })
})
