import { describe, expect, it } from 'vitest'
import type { Proposal } from './proposal'
import { hasBlockingRejection } from './bloqueo-por-rechazo'
import { motivoDelArreglo } from './motivo-del-arreglo'

const rechazada = (patch: Partial<Proposal> = {}): Proposal => ({
  id: 'prop-1',
  projectId: 'p1',
  findingId: 'f1',
  baseSha: 'viejo',
  state: 'RECHAZADO',
  analysisReason: motivoDelArreglo('src/infra/x.ts', 'aaaa1111'),
  createdAt: 1000,
  updatedAt: 1000,
  ...patch
})

describe('la pausa por arreglo fuera de la correa la levanta el terreno, no el HEAD (ADR-102 §4)', () => {
  it('mismo terreno declarado: sigue en pausa aunque el HEAD sea otro', () => {
    expect(hasBlockingRejection('f1', 'nuevo', [rechazada()], 'aaaa1111')).toBe(true)
  })

  it('cambia el terreno: vuelve a la baraja, incluso sobre el mismo arbol', () => {
    expect(hasBlockingRejection('f1', 'viejo', [rechazada()], 'bbbb2222')).toBe(false)
  })

  it('sin config antes ni ahora: "none" es un terreno, y coincide', () => {
    const sinConfig = rechazada({ analysisReason: motivoDelArreglo('src/infra/x.ts', 'none') })
    expect(hasBlockingRejection('f1', 'nuevo', [sinConfig], 'none')).toBe(true)
  })

  it('las demas causas siguen con su regla: el HEAD las levanta', () => {
    const gate = rechazada({ analysisReason: 'gate_failed_at=lint', baseSha: 'viejo' })
    expect(hasBlockingRejection('f1', 'viejo', [gate], 'aaaa1111')).toBe(true)
    expect(hasBlockingRejection('f1', 'nuevo', [gate], 'aaaa1111')).toBe(false)
  })

  it('manda la ultima: un intento posterior vivo deja sin efecto la pausa', () => {
    const viva = rechazada({ id: 'prop-2', state: 'ANALIZADO', createdAt: 2000 })
    expect(hasBlockingRejection('f1', 'nuevo', [rechazada(), viva], 'aaaa1111')).toBe(false)
  })
})
