import { describe, expect, it } from 'vitest'
import type { Proposal } from '@domain/repair/proposal'
import { bench, hallazgo } from './plan-repair-fixture'
import { planRepair } from './plan-repair'
import { propuesta } from './propuesta-del-plan'

const HEAD = 'abc1234'

const rechazada = (findingId: string, baseSha = HEAD): Proposal => ({
  id: `prop-${findingId}`,
  projectId: 'p1',
  findingId,
  baseSha,
  state: 'RECHAZADO',
  analysisReason: 'gate_failed_at=typecheck',
  createdAt: 1000,
  updatedAt: 1000
})

/**
 * El defecto que esto cierra se midio: un hallazgo cuyo fix murio en el gate
 * volvia a la cola —el rechazo es terminal, y lo terminal deja de ocultarlo— y
 * el motor compraba analisis y fix identicos vuelta tras vuelta. Diez veces, en
 * la primera corrida autonoma real, hasta agotar el tope de propuestas.
 */
describe('planRepair: hallazgos que ya fracasaron sobre esta misma base', () => {
  it('no vuelve a elegir el que murio en el gate con el arbol quieto', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], proposals: [rechazada('f1')] })
    expect(await planRepair(b.context, 'p1')).toMatchObject({ ok: false, reason: 'sin-candidato' })
    expect(b.inserted).toHaveLength(0)
  })

  it('excluido ese, C1 salta al siguiente elegible', async () => {
    const b = bench({
      findings: [hallazgo('f1', 'a.ts'), hallazgo('f2', 'b.ts')],
      proposals: [rechazada('f1')]
    })
    expect(propuesta(await planRepair(b.context, 'p1'))?.findingId).toBe('f2')
  })

  it('movido el arbol, el hallazgo vuelve a la baraja', async () => {
    const b = bench({
      findings: [hallazgo('f1', 'a.ts')],
      proposals: [rechazada('f1', 'sha-viejo')]
    })
    expect(propuesta(await planRepair(b.context, 'p1'))?.findingId).toBe('f1')
  })

  it('un veto de OMEGA no bloquea: ese camino es el del reintento', async () => {
    const vetada: Proposal = { ...rechazada('f1'), analysisReason: 'omega_vetado: no cubre' }
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], proposals: [vetada] })
    expect(propuesta(await planRepair(b.context, 'p1'))?.findingId).toBe('f1')
  })

  it('sin candidatos que queden, C1 devuelve null y el loop dira "baraja agotada"', async () => {
    const b = bench({
      findings: [hallazgo('f1', 'a.ts'), hallazgo('f2', 'b.ts')],
      proposals: [rechazada('f1'), rechazada('f2')]
    })
    expect(await planRepair(b.context, 'p1')).toMatchObject({ ok: false, reason: 'sin-candidato' })
  })
})
