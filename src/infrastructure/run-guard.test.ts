import { afterEach, describe, expect, it } from 'vitest'
import type { AppContext } from '@application/context'
import { endRun } from './run-control'
import { guardRun } from './run-guard'

/** Fake minimo: guardRun solo toca settings (tope) y runs (gasto de hoy). */
function context(perDay: string | null, costUsd: number): AppContext {
  return {
    settings: { get: (key: string) => (key === 'budget_per_day_usd' ? perDay : null) },
    runs: { usageSince: () => ({ costUsd }) }
  } as unknown as AppContext
}

describe('guardRun', () => {
  afterEach(() => endRun('p')) // libera el turno reservado entre pruebas

  it('deja pasar y reserva el turno cuando cabe en el tope diario', () => {
    expect(guardRun(context('10', 5), 'p')).toBeNull()
  })

  it('bloquea al alcanzar el tope diario y NO reserva turno', () => {
    const ctx = context('10', 10)
    expect(guardRun(ctx, 'p')).toContain('Tope diario')
    // Si hubiera reservado, el segundo intento seria BUSY; sigue siendo el tope.
    expect(guardRun(ctx, 'p')).toContain('Tope diario')
  })

  it('un segundo run del mismo proyecto es BUSY', () => {
    expect(guardRun(context('0', 0), 'p')).toBeNull()
    expect(guardRun(context('0', 0), 'p')).toContain('Ya hay una ejecucion')
  })

  it('perDay=0 nunca bloquea por gasto', () => {
    expect(guardRun(context('0', 9999), 'p')).toBeNull()
  })
})
