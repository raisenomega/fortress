import { describe, expect, it } from 'vitest'
import { bench, hallazgo } from './plan-repair-fixture'
import { planRepair } from './plan-repair'

const NOTA = { kind: 'gap' as const, area: 'grafo', note: 'no pude trazar el simbolo' }

describe('planRepair: lo que el analista nota de FORTRESS', () => {
  it('se asienta etiquetado con el NOMBRE del proyecto, no con su id', () => {
    // La observacion no es del proyecto auditado: es de FORTRESS, descubierta
    // trabajando ahi. Quien la lea despues necesita saber donde salio.
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], notes: [NOTA] })

    return planRepair(b.context, 'p1').then(() => {
      expect(b.observadas).toEqual([{ ...NOTA, sourceProject: 'Nucleo' }])
    })
  })

  it('sin apuntes no se asienta nada: cero notas es una respuesta valida', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')] })
    await planRepair(b.context, 'p1')

    expect(b.observadas).toHaveLength(0)
  })

  it('tambien se asientan cuando el hallazgo resulta OBSOLETO', async () => {
    // El hallazgo era un fantasma, pero el limite con el que el analista se
    // topo mientras lo comprobaba es igual de real. Se guarda igual.
    const b = bench({
      findings: [hallazgo('f1', 'a.ts')],
      verdictStatus: 'OBSOLETO',
      notes: [NOTA]
    })
    const proposal = await planRepair(b.context, 'p1')

    expect(proposal?.state).toBe('CADUCADO')
    expect(b.observadas).toHaveLength(1)
  })
})
