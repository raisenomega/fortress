import { describe, expect, it } from 'vitest'
import type { Finding } from './finding'
import { estadoDelTablero } from './estado-del-tablero'
import { filtrarElTablero, SIN_FILTRO, TODAS } from './filtro-del-tablero'

const f = (over: Partial<Finding>): Finding =>
  ({
    id: 'f1',
    severity: 'HIGH',
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

const CORPUS: readonly Finding[] = [
  f({ id: 'a', severity: 'CRITICAL', lifecycle: 'ACTIVE' }),
  f({ id: 'b', severity: 'HIGH', lifecycle: 'MITIGATED' }),
  f({ id: 'c', severity: 'HIGH', lifecycle: 'ACTIVE' }),
  f({ id: 'd', severity: 'HIGH', lifecycle: 'MITIGATED' }),
  f({ id: 'e', severity: 'LOW', status: 'false_positive' })
]

describe('los dos ejes se cruzan', () => {
  it('mitigados + HIGH da las HIGH verificables, que es el caso de uso', () => {
    const visibles = filtrarElTablero(CORPUS, { severidad: 'HIGH', estado: 'mitigados' })

    expect(visibles.map((x) => x.id)).toEqual(['b', 'd'])
  })

  it('un solo eje no basta: HIGH a secas arrastra las que no se pueden verificar', () => {
    // Es la razon de que haya DOS filas de chips y no una.
    expect(filtrarElTablero(CORPUS, { severidad: 'HIGH', estado: TODAS })).toHaveLength(3)
  })

  it('sin filtro devuelve el MISMO array: la referencia estable evita el bucle', () => {
    expect(filtrarElTablero(CORPUS, SIN_FILTRO)).toBe(CORPUS)
  })
})

describe('la casilla de un hallazgo', () => {
  it('descartado manda sobre mitigado: su dueño ya dijo que no contaba', () => {
    // Al reves, un mitigado descartado se ofreceria para verificar y gastaria
    // una corrida de agente en algo que nadie quiere.
    const ambos = f({ status: 'false_positive', lifecycle: 'MITIGATED' })

    expect(estadoDelTablero(ambos)).toBe('descartados')
  })

  it('mitigado manda sobre por-reparar: el limbo no pide trabajo al motor', () => {
    expect(estadoDelTablero(f({ lifecycle: 'MITIGATED' }))).toBe('mitigados')
  })

  it('y el resto cae en por-reparar', () => {
    expect(estadoDelTablero(f({}))).toBe('por-reparar')
  })
})
