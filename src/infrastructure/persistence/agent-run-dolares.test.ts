import { describe, expect, it } from 'vitest'
import { banco, corrida } from './agent-run-aggregates-fixture'

/**
 * Los dolares de unas corridas concretas: lo que el lazo del Motor mide para
 * frenar (ADR-110 §5). En dinero y no en `trabajoReal`, que excluye la
 * relectura —justo lo que una sesion reanudada multiplica—.
 */
describe('costUsdOf: el dinero de unas corridas, sumado', () => {
  it('sin ids no hay nada que sumar, y no se consulta la base', () => {
    expect(banco().agg.costUsdOf([])).toBe(0)
  })

  it('suma SOLO las que se le piden, no las del proyecto entero', () => {
    const { db, agg } = banco()
    const a = corrida(db, { costUsd: 0.45 })
    const b = corrida(db, { costUsd: 0.34 })
    corrida(db, { costUsd: 9 })

    expect(agg.costUsdOf([a, b])).toBeCloseTo(0.79, 6)
  })

  it('las fallidas SI cuentan: una corrida que revento tambien se pago', () => {
    const { db, agg } = banco()
    const roto = corrida(db, { costUsd: 0.2, failed: 1 })
    expect(agg.costUsdOf([roto])).toBeCloseTo(0.2, 6)
  })

  it('un id que no existe suma cero, no revienta: no se estima lo que falta', () => {
    const { db, agg } = banco()
    const a = corrida(db, { costUsd: 1 })
    expect(agg.costUsdOf([a, 'no-existe'])).toBeCloseTo(1, 6)
  })
})
