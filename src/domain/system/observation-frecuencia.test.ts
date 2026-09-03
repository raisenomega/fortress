import { describe, expect, it } from 'vitest'
import { areaFrequencies, ordenarObservaciones } from './observation-order'
import type { ObservationKind, SelfObservation } from './self-observation'

const obs = (
  id: string,
  area: string,
  kind: ObservationKind,
  createdAt: string
): SelfObservation => ({
  id,
  area,
  kind,
  note: `nota ${id}`,
  sourceProject: 'p',
  resolved: false,
  createdAt
})

describe('la frecuencia viaja con cada observacion, y cuenta el area LITERAL', () => {
  it('cada observacion lleva la frecuencia que la ordeno', () => {
    const r = ordenarObservaciones([
      obs('a', 'permisos', 'gap', '2026-08-20'),
      obs('b', 'permisos', 'gap', '2026-08-21'),
      obs('c', 'sola', 'gap', '2026-08-22')
    ])
    expect(r.map((o) => [o.id, o.areaFrequency])).toEqual([
      ['b', 2],
      ['a', 2],
      ['c', 1]
    ])
  })

  it('la frecuencia cuenta el area LITERAL: dos grafias no se suman', () => {
    // Es el sesgo que el fichero declara: "permisos" y "permisos MCP" son dos.
    const f = areaFrequencies([
      obs('a', 'permisos', 'gap', '1'),
      obs('b', 'permisos MCP', 'gap', '2'),
      obs('c', 'permisos', 'gap', '3')
    ])
    expect(f.get('permisos')).toBe(2)
    expect(f.get('permisos MCP')).toBe(1)
  })

  it('no muta la lista que recibe', () => {
    const entrada = [obs('a', 'x', 'oportunidad', '1'), obs('b', 'y', 'bug', '2')]
    ordenarObservaciones(entrada)
    expect(entrada.map((o) => o.id)).toEqual(['a', 'b'])
  })

  it('una lista vacia no rompe nada', () => {
    expect(ordenarObservaciones([])).toEqual([])
  })
})
