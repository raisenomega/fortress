import { describe, expect, it } from 'vitest'
import { ordenarObservaciones } from './observation-order'
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

describe('el orden del backlog: lo mas repetido, lo mas urgente, lo mas reciente', () => {
  it('manda la frecuencia del area, por encima del tipo', () => {
    // El bug esta solo en su area; las limitaciones comparten una repetida.
    const r = ordenarObservaciones([
      obs('bug-solo', 'rara', 'bug', '2026-08-29'),
      obs('a', 'permisos', 'limitacion', '2026-08-20'),
      obs('b', 'permisos', 'limitacion', '2026-08-21')
    ])
    expect(r.map((o) => o.id)).toEqual(['b', 'a', 'bug-solo'])
  })

  it('a igual frecuencia manda la urgencia: un bug antes que una oportunidad', () => {
    const r = ordenarObservaciones([
      obs('oport', 'x', 'oportunidad', '2026-08-29'),
      obs('falta', 'y', 'falta', '2026-08-29'),
      obs('bug', 'z', 'bug', '2026-08-01'),
      obs('gap', 'w', 'gap', '2026-08-29'),
      obs('limit', 'v', 'limitacion', '2026-08-29')
    ])
    expect(r.map((o) => o.id)).toEqual(['bug', 'gap', 'limit', 'falta', 'oport'])
  })

  it('a igual frecuencia y tipo, lo mas reciente primero', () => {
    const r = ordenarObservaciones([
      obs('vieja', 'a', 'gap', '2026-08-01'),
      obs('nueva', 'b', 'gap', '2026-08-29')
    ])
    expect(r.map((o) => o.id)).toEqual(['nueva', 'vieja'])
  })
})
