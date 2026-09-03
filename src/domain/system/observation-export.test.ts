import { describe, expect, it } from 'vitest'
import { buildObservationExport } from './observation-export'
import type { ObservationKind, SelfObservation } from './self-observation'

const obs = (id: string, area: string, kind: ObservationKind): SelfObservation =>
  ({ id, area, kind, note: `nota ${id}`, sourceProject: 'p', status: 'pendiente', reason: null, attendedBy: null, attendedAt: null, createdAt: '2026-08-20' }) // prettier-ignore

const AT = '2026-09-03T10:00:00.000Z'

describe('el fichero exportado se explica a si mismo', () => {
  it('lleva TODAS las observaciones, sin agrupar y sin perder ninguna', () => {
    const entrada = [obs('a', 'x', 'gap'), obs('b', 'y', 'bug'), obs('c', 'x', 'falta')]
    const out = buildObservationExport(entrada, AT)

    expect(out.total).toBe(3)
    expect(out.observaciones).toHaveLength(3)
    expect([...out.observaciones].map((o) => o.id).sort()).toEqual(['a', 'b', 'c'])
  })

  it('cuenta cuantas areas distintas hay: la medida del despiece', () => {
    const out = buildObservationExport([obs('a', 'x', 'gap'), obs('b', 'x', 'gap'), obs('c', 'y', 'gap')], AT) // prettier-ignore
    expect(out.areasDistintas).toBe(2)
  })

  it('DECLARA que su orden infravalora los temas reales', () => {
    // La advertencia no es adorno: sin ella el fichero se lee como un mapa de
    // temas, que es justo lo que no es.
    const { sesgoDelOrden } = buildObservationExport([obs('a', 'x', 'gap')], AT)

    expect(sesgoDelOrden).toContain('INFRAVALORA')
    expect(sesgoDelOrden).toContain('texto libre')
    expect(sesgoDelOrden).toContain('NO es un mapa de temas')
  })

  it('dice que no agrupa a proposito, y por que', () => {
    expect(buildObservationExport([], AT).comoUsarlo).toContain('sin agrupar a proposito')
  })

  it('cada observacion conserva sus campos y gana su frecuencia', () => {
    const [primera] = buildObservationExport([obs('a', 'x', 'gap')], AT).observaciones

    expect(primera).toMatchObject({ id: 'a', area: 'x', kind: 'gap', note: 'nota a', sourceProject: 'p', areaFrequency: 1 }) // prettier-ignore
  })

  it('un backlog vacio se exporta igual, diciendo que esta vacio', () => {
    const out = buildObservationExport([], AT)
    expect(out).toMatchObject({ total: 0, areasDistintas: 0, generadoEl: AT })
  })
})
