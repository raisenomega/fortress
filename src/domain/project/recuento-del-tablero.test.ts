import { describe, expect, it } from 'vitest'
import type { Finding } from './finding'
import { countFindings } from './severity-counts'
import { recuentoDelTablero } from './recuento-del-tablero'

const f = (id: string, severity: Finding['severity'], over: Partial<Finding> = {}): Finding =>
  ({
    id,
    severity,
    title: 't',
    file: 'a.ts',
    line: 1,
    status: 'open',
    lifecycle: 'ACTIVE',
    mitigatedNote: null,
    verificacionNote: null,
    lastSeen: '2026-09-01T00:00:00Z',
    ...over
  }) as Finding

const M = { lifecycle: 'MITIGATED' as const }

const CORPUS: readonly Finding[] = [
  f('a', 'CRITICAL'),
  f('b', 'CRITICAL'),
  f('c', 'HIGH', M),
  f('d', 'HIGH', M),
  f('e', 'HIGH'),
  f('g', 'LOW', { status: 'false_positive' })
]

describe('los chips prometen lo que muestran', () => {
  it('los numeros salen del ARRAY de la tabla, no de una consulta aparte', () => {
    const { porSeveridad, totalSeveridad } = recuentoDelTablero(CORPUS, {
      severidad: 'ALL',
      estado: 'ALL'
    })

    // countsByProject excluye los descartados; el chip los cuenta porque la
    // tabla los pinta. Si el chip dijera 5 y salieran 6 filas, el numero
    // dejaria de ser la promesa de lo que vas a ver.
    expect(porSeveridad).toEqual(countFindings(CORPUS))
    expect(totalSeveridad).toBe(6)
    expect(porSeveridad.LOW).toBe(1)
  })

  it('los ejes se cuentan CRUZADOS: en mitigados, HIGH dice 2 y no 3', () => {
    const { porSeveridad, totalSeveridad } = recuentoDelTablero(CORPUS, {
      severidad: 'ALL',
      estado: 'mitigados'
    })

    expect(porSeveridad.HIGH).toBe(2)
    expect(porSeveridad.CRITICAL).toBe(0)
    // Y el chip «todas» de esa fila cuenta su propia vista, no la tabla entera.
    expect(totalSeveridad).toBe(2)
  })

  it('y al reves: con HIGH puesto, el chip de mitigados dice 2 de 3', () => {
    const { porEstado, totalEstado } = recuentoDelTablero(CORPUS, {
      severidad: 'HIGH',
      estado: 'ALL'
    })

    expect(porEstado).toEqual({ 'por-reparar': 1, mitigados: 2, descartados: 0 })
    expect(totalEstado).toBe(3)
  })
})
