import { describe, expect, it } from 'vitest'
import { bench, hallazgo } from './plan-repair-fixture'
import { planRepair } from './plan-repair'
import { propuesta } from './propuesta-del-plan'

describe('un analisis que no se dejo leer no es un hallazgo que se fue', () => {
  it('analisis ILEGIBLE queda RECHAZADO, no CADUCADO: no se afirma que el hallazgo se fue', async () => {
    // Tres CADUCADO reales eran JSON truncado. El motor escribia "el hallazgo
    // ya no existe" sin haber llegado a leer si existia.
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], verdictStatus: 'ILEGIBLE' })
    const proposal = propuesta(await planRepair(b.context, 'p1'))

    expect(b.patches[0]).toMatchObject({ state: 'RECHAZADO', analysisVerdict: 'ILEGIBLE' })
    expect(b.patches[0].analysisReason).toContain('analisis_ilegible')
    expect(proposal?.state).not.toBe('CADUCADO')
  })

  it('el Libro de un ilegible no dice caducado ni lo archiva en EXPIRE', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], verdictStatus: 'ILEGIBLE' })
    await planRepair(b.context, 'p1')
    const transicion = b.events.filter((e) => e.eventType === 'TRANSITION').at(-1)

    expect(transicion?.toState).toBe('RECHAZADO')
    expect(transicion?.phase).toBe('ANALYZE')
    expect(transicion?.reason).toContain('analisis_ilegible')
  })
})
