import type { AreaDeObservacion } from '@domain/system/area-de-observacion'
import { describe, expect, it } from 'vitest'
import type { SelfObservationRepository } from '@domain/system/self-observation-repository'
import { createMemoryDb } from './memory-db'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'

/** Cierra una observacion del `area` dada; sin fecha la deja pendiente. */
function cerrar(r: SelfObservationRepository, area: AreaDeObservacion, at: string | null): string {
  const o = r.add({ sourceProject: 'p', kind: 'gap', area, note: `nota de ${area}` })
  if (at !== null) {
    r.setStatus({ id: o.id, status: 'atendido', reason: 'hecho', attendedBy: 'x', attendedAt: at })
  }
  return o.id
}

describe('listClosed: la memoria de lo ya tratado', () => {
  it('trae las cerradas y deja fuera las pendientes', () => {
    const r = createSqliteSelfObservationRepository(createMemoryDb())
    cerrar(r, 'consulta-del-grafo', '2026-09-01T10:00:00Z')
    cerrar(r, 'indice-del-grafo', null)

    expect(r.listClosed(40).map((o) => o.area)).toEqual(['consulta-del-grafo'])
  })

  it('el descarte tambien es cerrado: != pendiente, no == atendido', () => {
    const r = createSqliteSelfObservationRepository(createMemoryDb())
    const id = cerrar(r, 'cognicion', '2026-09-01T10:00:00Z')
    r.setStatus({ id, status: 'descartado', reason: 'no aplica', attendedBy: 'x', attendedAt: '2026-09-01T10:00:00Z' }) // prettier-ignore

    expect(r.listClosed(40)).toMatchObject([{ status: 'descartado', reason: 'no aplica' }])
  })

  it('las mas recientes primero, por cuando se CERRO', () => {
    const r = createSqliteSelfObservationRepository(createMemoryDb())
    cerrar(r, 'anclaje-del-hallazgo', '2026-03-01T10:00:00Z')
    cerrar(r, 'contexto-del-agente', '2026-09-01T10:00:00Z')
    cerrar(r, 'contrato-del-hallazgo', '2026-06-01T10:00:00Z')

    expect(r.listClosed(40).map((o) => o.area)).toEqual(['contexto-del-agente', 'contrato-del-hallazgo', 'anclaje-del-hallazgo'])
  })

  it('el tope lo aplica el SQL, y se queda con las recientes', () => {
    const r = createSqliteSelfObservationRepository(createMemoryDb())
    cerrar(r, 'anclaje-del-hallazgo', '2026-03-01T10:00:00Z')
    cerrar(r, 'contexto-del-agente', '2026-09-01T10:00:00Z')

    expect(r.listClosed(1).map((o) => o.area)).toEqual(['contexto-del-agente'])
  })

  it('sin ninguna cerrada devuelve vacio', () => {
    const r = createSqliteSelfObservationRepository(createMemoryDb())
    cerrar(r, 'indice-del-grafo', null)

    expect(r.listClosed(40)).toEqual([])
  })
})
