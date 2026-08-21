import { describe, expect, it } from 'vitest'
import { planRepair } from './plan-repair'
import { bench, hallazgo } from './plan-repair-fixture'

/**
 * El descuento por obsoleto se pide con el HEAD del repo, no con el escaneo.
 * Atado al escaneo, un hallazgo que sobrevivia en memoria de una corrida
 * anterior era inmune: se declaraba obsoleto y volvia a la cola en el ciclo
 * siguiente, quemando un analista cada vez.
 */
describe('planRepair — el descuento por obsoleto se ancla al arbol', () => {
  it('pide el descuento con el HEAD, no con el id del escaneo', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], sha: 'head-vivo' })
    await planRepair(b.context, 'p1')
    expect(b.anclaDelDescuento).toEqual(['head-vivo'])
    expect(b.anclaDelDescuento).not.toContain('scan-1')
  })

  it('un hallazgo descontado no se elige, aunque su escaneo sea antiguo', async () => {
    const b = bench({
      findings: [hallazgo('f1', 'a.ts')],
      obsoleteIds: ['f1'],
      sha: 'head-vivo'
    })
    expect(await planRepair(b.context, 'p1')).toBeNull()
    expect(b.inserted).toEqual([])
  })

  it('sin descuento, el hallazgo se elige con normalidad', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], sha: 'head-vivo' })
    expect(await planRepair(b.context, 'p1')).not.toBeNull()
    expect(b.inserted).toHaveLength(1)
  })
})
