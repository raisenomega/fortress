import { describe, expect, it } from 'vitest'
import { bench, hallazgo } from './plan-repair-fixture'
import { planRepair } from './plan-repair'

describe('planRepair — libro de vida', () => {
  it('caso REAL: 3 eventos — SELECT, AGENT_RUN y TRANSITION a ANALIZADO', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], verdictStatus: 'REAL' })
    await planRepair(b.context, 'p1')

    expect(b.events.map((e) => [e.seq, e.phase, e.eventType, e.actor])).toEqual([
      [1, 'SELECT', 'TRANSITION', 'motor'],
      [2, 'ANALYZE', 'AGENT_RUN', 'claude-analyst'],
      [3, 'ANALYZE', 'TRANSITION', 'motor']
    ])
    expect(b.events[0]).toMatchObject({ toState: 'ELEGIDO', scanId: 'scan-1' })
    expect(b.events[1]).toMatchObject({ costTokens: 7, durationMs: 99 })
    expect(b.events[2]).toMatchObject({ fromState: 'ELEGIDO', toState: 'ANALIZADO', reason: 'riesgo bajo' }) // prettier-ignore
    expect(JSON.parse(b.events[2].evidenceJson ?? '{}').status).toBe('REAL')
  })

  it('caso OBSOLETO: la cadena termina en TRANSITION EXPIRE a CADUCADO', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], verdictStatus: 'OBSOLETO' })
    await planRepair(b.context, 'p1')

    expect(b.events).toHaveLength(3)
    expect(b.events[2]).toMatchObject({ phase: 'EXPIRE', toState: 'CADUCADO' })
  })

  it('si el libro LANZA, la transicion persistida queda: telemetria, no gate', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], eventLogThrows: true })
    const proposal = await planRepair(b.context, 'p1')

    // El estado se escribio (insert + patch) aunque ningun evento se asento.
    expect(proposal?.state).toBe('ANALIZADO')
    expect(b.inserted).toHaveLength(1)
    expect(b.patches).toHaveLength(1)
    expect(b.events).toHaveLength(0)
  })
})
