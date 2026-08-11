import { describe, expect, it } from 'vitest'
import { retryRepair } from './retry-repair'
import { retryBench, vieja } from './retry-repair-fixture'

const OLD = vieja()

describe('retryRepair (I4.2) — la nueva propuesta y su libro', () => {
  it('REAL: nace ELEGIDO sobre el HEAD ACTUAL con retry_of y queda ANALIZADO', async () => {
    const b = retryBench({ verdictStatus: 'REAL' })
    const r = await retryRepair(b.context, OLD.id)
    if (!r.ok) throw new Error(r.reason)

    expect(b.inserted[0]).toMatchObject({
      id: r.newProposalId, findingId: 'f1', state: 'ELEGIDO',
      baseSha: 'abc1234', analysisReason: 'retry_of=vieja123'
    }) // prettier-ignore
    expect(b.inserted[0].id).not.toBe(OLD.id)
    expect(b.patches[0]).toMatchObject({
      id: r.newProposalId, state: 'ANALIZADO', analysisVerdict: 'REAL',
      analysisReason: expect.stringMatching(/^retry_of=vieja123; /)
    }) // prettier-ignore
  })

  it('OBSOLETO: la NUEVA caduca (final valido, ok:true); la vieja ni se toca', async () => {
    const b = retryBench({ verdictStatus: 'OBSOLETO' })
    const r = await retryRepair(b.context, OLD.id)

    expect(r.ok).toBe(true)
    expect(b.patches[0]).toMatchObject({ state: 'CADUCADO', analysisVerdict: 'OBSOLETO' })
    expect(b.patches.some((p) => p.id === OLD.id)).toBe(false)
  })

  it('libro: seq1 SELECT con linaje completo, luego AGENT_RUN y TRANSITION del C2', async () => {
    const b = retryBench({})
    const r = await retryRepair(b.context, OLD.id)
    if (!r.ok) throw new Error(r.reason)

    expect(b.events.map((e) => [e.seq, e.eventType, e.phase])).toEqual([
      [1, 'TRANSITION', 'SELECT'],
      [2, 'AGENT_RUN', 'ANALYZE'],
      [3, 'TRANSITION', 'ANALYZE']
    ])
    expect(JSON.parse(b.events[0].evidenceJson ?? '{}')).toEqual({
      findingId: 'f1', retry_of: OLD.id, baseSha: 'abc1234', source: 'retry'
    }) // prettier-ignore
    expect(b.events[0].reason).toBe('retry_of=vieja123')
  })
})
