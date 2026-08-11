import { describe, expect, it } from 'vitest'
import { retryRepair } from './retry-repair'
import { retryBench, vieja } from './retry-repair-fixture'

const OLD = vieja()

describe('retryRepair (I4.2) — guardas', () => {
  it('propuesta desconocida: unknown_proposal y nada insertado', async () => {
    const b = retryBench({ old: null })
    const r = await retryRepair(b.context, OLD.id)
    expect(r).toEqual({ ok: false, reason: 'unknown_proposal' })
    expect(b.inserted).toHaveLength(0)
  })

  it('rechazo TECNICO (budget_exceeded) es invisible: not_retryable', async () => {
    const b = retryBench({ old: vieja({ analysisReason: 'budget_exceeded' }) })
    expect(await retryRepair(b.context, OLD.id)).toEqual({ ok: false, reason: 'not_retryable' })
  })

  it('estado no-RECHAZADO jamas se reintenta, aunque la razon calce', async () => {
    const b = retryBench({ old: vieja({ state: 'OMEGA' }) })
    expect(await retryRepair(b.context, OLD.id)).toEqual({ ok: false, reason: 'not_retryable' })
  })

  it('hallazgo extinto (ya no vive en memoria): finding_extinct', async () => {
    const b = retryBench({ findings: [] })
    expect(await retryRepair(b.context, OLD.id)).toEqual({ ok: false, reason: 'finding_extinct' })
    expect(b.inserted).toHaveLength(0)
  })

  it('propuesta posterior sobre el mismo hallazgo: already_superseded_by', async () => {
    const b = retryBench({ otras: [vieja({ id: 'posterio-0000-4000-8000-000000000000', createdAt: 300 })] }) // prettier-ignore
    const r = await retryRepair(b.context, OLD.id)
    expect(r).toEqual({ ok: false, reason: 'already_superseded_by=posterio' })
  })

  it('doble retry: el segundo choca con la nueva del primero', async () => {
    const b = retryBench({})
    const first = await retryRepair(b.context, OLD.id)
    if (!first.ok) throw new Error(first.reason)
    const second = await retryRepair(b.context, OLD.id)
    expect(second).toEqual({
      ok: false,
      reason: `already_superseded_by=${first.newProposalId.slice(0, 8)}`
    })
    expect(b.inserted).toHaveLength(1)
  })

  it('sin repo git no hay ancla: no_git_head y nada insertado', async () => {
    const b = retryBench({ sha: null })
    expect(await retryRepair(b.context, OLD.id)).toEqual({ ok: false, reason: 'no_git_head' })
    expect(b.inserted).toHaveLength(0)
  })
})
