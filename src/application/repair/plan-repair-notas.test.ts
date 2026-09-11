import { describe, expect, it } from 'vitest'
import { bench, hallazgo } from './plan-repair-fixture'
import { planRepair } from './plan-repair'

import type { SelfNoteDraft } from '@domain/system/self-observation'

const NOTA: SelfNoteDraft = {
  kind: 'gap',
  area: 'consulta-del-grafo',
  note: 'no pude trazar el simbolo'
}

describe('planRepair: lo que el analista nota de FORTRESS', () => {
  it('se asienta etiquetado con el NOMBRE del proyecto, no con su id', () => {
    // La observacion no es del proyecto auditado: es de FORTRESS, descubierta
    // trabajando ahi. Quien la lea despues necesita saber donde salio.
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], notes: [NOTA] })

    return planRepair(b.context, 'p1').then(() => {
      expect(b.observadas).toEqual([{ ...NOTA, sourceProject: 'Nucleo', projectPath: '/repo/p1' }])
    })
  })

  it('y con la RUTA del proyecto, que es lo que el cerco necesita (ADR-085)', () => {
    // El nombre no basta para tachar una ruta absoluta: `/media/disco/Cliente
    // ACME` delata al cliente aunque no lleve fichero detras, y solo la ruta
    // permite reconocerla dentro del texto de la nota.
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], notes: [NOTA] })

    return planRepair(b.context, 'p1').then(() => {
      expect(b.observadas[0]).toMatchObject({ projectPath: '/repo/p1' })
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
