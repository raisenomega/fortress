import { describe, expect, it } from 'vitest'
import { bench, hallazgo } from './plan-repair-fixture'
import { planRepair } from './plan-repair'
import { propuesta } from './propuesta-del-plan'

/**
 * ADR-059, primera aplicacion: la cola de candidatos descuenta los hallazgos
 * que ya tienen propuesta viva. Sin esto la seleccion, que es determinista por
 * diseno, devolveria el mismo elegido en cada ronda mientras su propuesta
 * espera la firma humana.
 */
describe('planRepair: hallazgos con propuesta viva', () => {
  it('un hallazgo con propuesta viva NO se re-propone', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], liveIds: ['f1'] })
    expect(await planRepair(b.context, 'p1')).toMatchObject({ ok: false, reason: 'sin-candidato' })
    expect(b.inserted).toHaveLength(0)
  })

  it('excluida la viva, C1 salta al siguiente elegible', async () => {
    const b = bench({
      findings: [hallazgo('f1', 'a.ts'), hallazgo('f2', 'b.ts')],
      liveIds: ['f1']
    })
    expect(propuesta(await planRepair(b.context, 'p1'))?.findingId).toBe('f2')
  })

  it('muerta la propuesta, el hallazgo vuelve a la cola', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], liveIds: [] })
    expect(propuesta(await planRepair(b.context, 'p1'))?.findingId).toBe('f1')
  })

  it('viva y obsoleta se acumulan: ninguna de las dos vuelve a salir', async () => {
    const b = bench({
      findings: [hallazgo('f1', 'a.ts'), hallazgo('f2', 'b.ts')],
      liveIds: ['f1'],
      obsoleteIds: ['f2']
    })
    expect(await planRepair(b.context, 'p1')).toMatchObject({ ok: false, reason: 'sin-candidato' })
  })
})
