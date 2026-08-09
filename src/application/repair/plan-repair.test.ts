import { describe, expect, it } from 'vitest'
import { bench, hallazgo } from './plan-repair-fixture'
import { planRepair } from './plan-repair'

describe('planRepair (C1 -> C2 cableados)', () => {
  it('sin candidatos devuelve null y no inserta nada', async () => {
    const b = bench({ findings: [] })
    expect(await planRepair(b.context, 'p1')).toBeNull()
    expect(b.inserted).toHaveLength(0)
  })

  it('candidato REAL queda ANALIZADO persistido con veredicto REAL', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], verdictStatus: 'REAL' })
    const proposal = await planRepair(b.context, 'p1')

    expect(b.inserted).toHaveLength(1)
    expect(b.inserted[0]).toMatchObject({ findingId: 'f1', state: 'ELEGIDO', baseSha: 'abc1234' })
    expect(b.patches[0]).toMatchObject({ state: 'ANALIZADO', analysisVerdict: 'REAL' })
    expect(proposal?.state).toBe('ANALIZADO')
  })

  it('candidato OBSOLETO queda CADUCADO persistido con veredicto OBSOLETO', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], verdictStatus: 'OBSOLETO' })
    const proposal = await planRepair(b.context, 'p1')

    expect(b.patches[0]).toMatchObject({ state: 'CADUCADO', analysisVerdict: 'OBSOLETO' })
    expect(proposal?.state).toBe('CADUCADO')
  })

  it('un hallazgo con propuesta OBSOLETA del mismo escaneo NO se re-propone', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], obsoleteIds: ['f1'] })
    expect(await planRepair(b.context, 'p1')).toBeNull()
    expect(b.inserted).toHaveLength(0)
  })

  it('excluido el obsoleto, C1 salta al siguiente elegible', async () => {
    const b = bench({
      findings: [hallazgo('f1', 'a.ts'), hallazgo('f2', 'b.ts')],
      obsoleteIds: ['f1']
    })
    const proposal = await planRepair(b.context, 'p1')
    expect(proposal?.findingId).toBe('f2')
  })

  it('sin repo git no hay ancla: null y nada insertado', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], sha: null })
    expect(await planRepair(b.context, 'p1')).toBeNull()
    expect(b.inserted).toHaveLength(0)
  })
})
