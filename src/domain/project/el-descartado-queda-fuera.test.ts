import { describe, expect, it } from 'vitest'
import type { Finding } from './finding'
import { estadoDelTablero } from './estado-del-tablero'
import { recuentoDelTablero } from './recuento-del-tablero'
import { verificable } from './verificable'

const f = (id: string, over: Partial<Finding> = {}): Finding =>
  ({
    id,
    severity: 'HIGH',
    title: 't',
    file: 'a.ts',
    line: 1,
    status: 'open',
    lifecycle: 'MITIGATED',
    mitigatedNote: null,
    verificacionNote: null,
    lastSeen: '2026-09-01T00:00:00Z',
    ...over
  }) as Finding

/**
 * El caso que la base del operador tiene de verdad: 25 mitigados abiertos y UNO
 * mitigado que ademas esta descartado. Antes ese entraba en las tres cuentas y
 * el barrido le gastaba una corrida de agente.
 */
const CORPUS: readonly Finding[] = [
  ...Array.from({ length: 25 }, (_, i) => f(`m${i}`)),
  f('descartado', { status: 'false_positive' })
]

describe('el mitigado descartado queda fuera de las tres cuentas', () => {
  it('el chip Mitigados dice 25, no 26', () => {
    const { porEstado } = recuentoDelTablero(CORPUS, { severidad: 'ALL', estado: 'ALL' })

    expect(porEstado.mitigados).toBe(25)
  })

  it('y aparece en Descartados, que es donde su dueño lo puso', () => {
    const { porEstado } = recuentoDelTablero(CORPUS, { severidad: 'ALL', estado: 'ALL' })

    expect(porEstado.descartados).toBe(1)
    expect(estadoDelTablero(f('x', { status: 'false_positive' }))).toBe('descartados')
  })

  it('el contador del boton —los verificables— tambien dice 25', () => {
    expect(CORPUS.filter(verificable)).toHaveLength(25)
  })

  it('y su fila no ofrece cajita: verificarlo gastaria en lo que no cuenta', () => {
    expect(verificable(f('descartado', { status: 'false_positive' }))).toBe(false)
  })

  it('el chip y el contador COINCIDEN, y son DOS funciones distintas', () => {
    // `estadoDelTablero` reparte por casillas y `verificable` decide si se puede
    // comprobar: son dos criterios escritos aparte, y tienen que dar lo mismo
    // sobre el limbo. Cuando divergieron, la pantalla dijo 25 y el boton 26.
    const { porEstado } = recuentoDelTablero(CORPUS, { severidad: 'ALL', estado: 'ALL' })

    expect(porEstado.mitigados).toBe(CORPUS.filter(verificable).length)
  })

  it('y coinciden sobre cualquier mezcla, no solo sobre esta', () => {
    const mezcla = [
      f('a'),
      f('b', { status: 'false_positive' }),
      f('c', { lifecycle: 'ACTIVE' }),
      f('d', { lifecycle: 'ACTIVE', status: 'false_positive' })
    ]
    const { porEstado } = recuentoDelTablero(mezcla, { severidad: 'ALL', estado: 'ALL' })

    expect(porEstado.mitigados).toBe(mezcla.filter(verificable).length)
  })
})
