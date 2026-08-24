import { describe, expect, it } from 'vitest'
import { bench } from './generate-fix-fixture'
import { generateFix } from './generate-fix'

describe('generateFix (C3)', () => {
  it('camino feliz: GENERADO con WORKTREE_CREATE + AGENT_RUN + TRANSITION', async () => {
    const b = bench()
    const result = await generateFix(b.context, 'prop-1', b.deps)

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.commitSha).toBe('c'.repeat(40))
    expect(b.patches.at(-1)).toMatchObject({ state: 'GENERADO' })
    expect(b.events.map((e) => [e.eventType, e.phase])).toEqual([
      ['DECISION', 'GENERATE'],
      ['AGENT_RUN', 'GENERATE'],
      ['TRANSITION', 'GENERATE']
    ])
    expect(b.events[2].toState).toBe('GENERADO')
    expect(b.calls).toEqual(['create', 'generate', 'commit'])
  })

  it('R1: si NO es la mas reciente, CADUCA superseded_by sin spawnear nada', async () => {
    const b = bench({ latestId: 'prop-nueva' })
    const result = await generateFix(b.context, 'prop-1', b.deps)

    expect(result).toMatchObject({ ok: false, reason: 'superseded' })
    expect(b.patches.at(-1)).toMatchObject({ state: 'CADUCADO', analysisReason: 'superseded_by=prop-nue' }) // prettier-ignore
    expect(b.calls).toEqual([])
  })

  it('R2 previo: sin margen para el generador, RECHAZADO sin spawn', async () => {
    const b = bench({ spentPrevio: 1_900_000 })
    expect(await generateFix(b.context, 'prop-1', b.deps)).toMatchObject({ ok: false, reason: 'budget_exceeded' }) // prettier-ignore
    expect(b.calls).toEqual([])
  })
})

describe('generateFix (C3) — verificacion post-generacion', () => {
  it('scope: tocar fuera de lo permitido RECHAZA y CONSERVA el worktree', async () => {
    const b = bench({ changed: ['src/otra/cosa.ts'] })
    expect(await generateFix(b.context, 'prop-1', b.deps)).toMatchObject({ ok: false, reason: 'scope_violation' }) // prettier-ignore
    expect(b.calls).not.toContain('remove')
    expect(b.patches.at(-1)).toMatchObject({ state: 'RECHAZADO', analysisReason: 'scope_violation' }) // prettier-ignore
  })

  it('sin diff: RECHAZADO no_diff_produced y worktree LIMPIADO', async () => {
    const b = bench({ hasChanges: false })
    expect(await generateFix(b.context, 'prop-1', b.deps)).toMatchObject({ ok: false, reason: 'no_diff_produced' }) // prettier-ignore
    expect(b.calls).toContain('remove')
  })

  it('R2 posterior: la factura real excede el tope, RECHAZADO y CONSERVA', async () => {
    const b = bench({ spentPrevio: 1_600_000, genCost: 500_000 })
    expect(await generateFix(b.context, 'prop-1', b.deps)).toMatchObject({ ok: false, reason: 'budget_exceeded' }) // prettier-ignore
    expect(b.calls).not.toContain('remove')
  })

  it('generador roto: RECHAZADO provider_error, factura asentada, CONSERVA', async () => {
    const b = bench({ generatorFails: true })
    expect(await generateFix(b.context, 'prop-1', b.deps)).toMatchObject({ ok: false, reason: 'provider_error' }) // prettier-ignore
    expect(b.events.some((e) => e.eventType === 'AGENT_RUN')).toBe(true)
    expect(b.calls).not.toContain('remove')
  })

  it('estado invalido o cadena sin analisis: no muta nada', async () => {
    const b = bench({ state: 'GENERADO' })
    expect(await generateFix(b.context, 'prop-1', b.deps)).toMatchObject({ ok: false, reason: 'invalid_state' }) // prettier-ignore
    const c = bench({ conAnalisis: false })
    expect(await generateFix(c.context, 'prop-1', c.deps)).toMatchObject({ ok: false, reason: 'invalid_state' }) // prettier-ignore
    expect([...b.patches, ...c.patches]).toEqual([])
  })
})
