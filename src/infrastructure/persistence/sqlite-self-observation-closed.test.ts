import { describe, expect, it } from 'vitest'
import type { SelfObservationRepository } from '@domain/system/self-observation-repository'
import { createMemoryDb } from './memory-db'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'

/** Cierra `area` en la fecha dada; sin fecha la deja pendiente. */
function cerrar(r: SelfObservationRepository, area: string, at: string | null): string {
  const o = r.add({ sourceProject: 'p', kind: 'gap', area, note: `nota de ${area}` })
  if (at !== null) {
    r.setStatus({ id: o.id, status: 'atendido', reason: 'hecho', attendedBy: 'x', attendedAt: at })
  }
  return o.id
}

describe('listClosed: la memoria de lo ya tratado', () => {
  it('trae las cerradas y deja fuera las pendientes', () => {
    const r = createSqliteSelfObservationRepository(createMemoryDb())
    cerrar(r, 'atendida', '2026-09-01T10:00:00Z')
    cerrar(r, 'pendiente', null)

    expect(r.listClosed(40).map((o) => o.area)).toEqual(['atendida'])
  })

  it('el descarte tambien es cerrado: != pendiente, no == atendido', () => {
    const r = createSqliteSelfObservationRepository(createMemoryDb())
    const id = cerrar(r, 'descartada', '2026-09-01T10:00:00Z')
    r.setStatus({ id, status: 'descartado', reason: 'no aplica', attendedBy: 'x', attendedAt: '2026-09-01T10:00:00Z' }) // prettier-ignore

    expect(r.listClosed(40)).toMatchObject([{ status: 'descartado', reason: 'no aplica' }])
  })

  it('las mas recientes primero, por cuando se CERRO', () => {
    const r = createSqliteSelfObservationRepository(createMemoryDb())
    cerrar(r, 'vieja', '2026-03-01T10:00:00Z')
    cerrar(r, 'nueva', '2026-09-01T10:00:00Z')
    cerrar(r, 'media', '2026-06-01T10:00:00Z')

    expect(r.listClosed(40).map((o) => o.area)).toEqual(['nueva', 'media', 'vieja'])
  })

  it('el tope lo aplica el SQL, y se queda con las recientes', () => {
    const r = createSqliteSelfObservationRepository(createMemoryDb())
    cerrar(r, 'vieja', '2026-03-01T10:00:00Z')
    cerrar(r, 'nueva', '2026-09-01T10:00:00Z')

    expect(r.listClosed(1).map((o) => o.area)).toEqual(['nueva'])
  })

  it('sin ninguna cerrada devuelve vacio', () => {
    const r = createSqliteSelfObservationRepository(createMemoryDb())
    cerrar(r, 'pendiente', null)

    expect(r.listClosed(40)).toEqual([])
  })
})
