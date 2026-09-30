import { describe, expect, it } from 'vitest'
import type { FindingMemory } from '@domain/project/finding-memory'
import { planRepair } from './plan-repair'
import { bench, hallazgo } from './plan-repair-fixture'

const mitigado = (f: FindingMemory): FindingMemory => ({ ...f, lifecycle: 'MITIGATED' })

/**
 * Sacar de la cola lo ya arreglado es la mitad del sentido de MITIGATED, y no
 * costo codigo: el filtro de candidatos ya exigia ACTIVE. Este test lo fija,
 * porque es un comportamiento que se perderia sin ruido si alguien relajara
 * ese filtro.
 */
describe('un hallazgo mitigado no vuelve a la cola del motor', () => {
  it('mitigado: no hay a quien elegir', async () => {
    const b = bench({ findings: [mitigado(hallazgo('f1', 'a.ts'))], sha: 'head-vivo' })
    expect(await planRepair(b.context, 'p1')).toMatchObject({ ok: false, reason: 'sin-candidato' })
    expect(b.inserted).toEqual([])
  })

  it('no-regresion: el mismo hallazgo ACTIVE si se elige', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], sha: 'head-vivo' })
    expect(await planRepair(b.context, 'p1')).not.toBeNull()
  })
})
