import { describe, expect, it } from 'vitest'
import type { SelfObservationRepository } from '@domain/system/self-observation-repository'
import { createMemoryDb } from './memory-db'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'

const AT = '2026-09-04T02:10:00.000Z'

function conEstados(): SelfObservationRepository {
  const r = createSqliteSelfObservationRepository(createMemoryDb())
  const p = r.add({ sourceProject: 'p', kind: 'gap', area: 'consulta-del-grafo', note: 'n' })
  const a = r.add({ sourceProject: 'p', kind: 'gap', area: 'indice-del-grafo', note: 'n' })
  const d = r.add({ sourceProject: 'p', kind: 'gap', area: 'cognicion', note: 'n' })
  r.setStatus({ id: a.id, status: 'atendido', reason: 'hecho', attendedBy: 'x', attendedAt: AT })
  r.setStatus({ id: d.id, status: 'descartado', reason: 'no aplica', attendedBy: 'x', attendedAt: AT }) // prettier-ignore
  void p
  return r
}

describe('listAll: lo que el panel necesita para PINTAR, no para trabajar', () => {
  it('trae los tres estados, que es lo que listOpen no podia dar', () => {
    // Sin las cerradas el panel solo sabia pintar lo que faltaba: verde y rojo
    // no tenian nada que pintar.
    const todas = conEstados().listAll()

    expect(todas.map((o) => o.status).sort()).toEqual(['atendido', 'descartado', 'pendiente'])
  })

  it('el motivo del cierre viaja: el operador ve POR QUE se cerro', () => {
    const cerradas = conEstados()
      .listAll()
      .filter((o) => o.status !== 'pendiente')

    expect(cerradas.map((o) => o.reason).sort()).toEqual(['hecho', 'no aplica'])
  })

  it('no filtra nada: listOpen sigue siendo el subconjunto abierto', () => {
    const r = conEstados()

    expect(r.listAll()).toHaveLength(3)
    expect(r.listOpen()).toHaveLength(1)
  })
})
