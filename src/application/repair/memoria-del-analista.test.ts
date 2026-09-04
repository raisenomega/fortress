import { describe, expect, it } from 'vitest'
import type { SelfObservation } from '@domain/system/self-observation'
import { bench, hallazgo } from './plan-repair-fixture'
import { planRepair } from './plan-repair'
import { retryRepair } from './retry-repair'
import { retryBench, vieja } from './retry-repair-fixture'

// prettier-ignore
const CERRADA: SelfObservation = {
  id: 'o1', sourceProject: 'p', kind: 'gap', area: 'grafo', note: 'auto-indexa sin permiso',
  status: 'atendido', reason: 'arreglado', attendedBy: 'x', attendedAt: '2026-09-01', createdAt: '2026-08-01'
}
const LINEA = 'grafo — auto-indexa sin permiso'

describe('el motor le pasa al analista lo que FORTRESS ya trato', () => {
  it('planRepair: el analista estudia CON la memoria delante', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], cerradas: [CERRADA] })
    await planRepair(b.context, 'p1')

    expect(b.memoria).toEqual([[LINEA]])
  })

  it('sin cerradas el analista recibe una lista vacia, no basura', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')] })
    await planRepair(b.context, 'p1')

    expect(b.memoria).toEqual([[]])
  })

  it('el REINTENTO tambien la recibe: los dos caminos, un mismo destino', async () => {
    // Es la razon de que la lectura viva en `estudiar` y no en cada llamador:
    // el mismo hecho no puede depender de por donde se entre (ADR-059).
    const b = retryBench({ verdictStatus: 'REAL', cerradas: [CERRADA] })
    const r = await retryRepair(b.context, vieja().id)

    expect(r.ok).toBe(true)
    expect(b.memoria).toEqual([[LINEA]])
  })
})
