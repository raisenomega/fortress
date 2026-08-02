import { describe, expect, it } from 'vitest'
import { DEFAULT_BUDGET, dayLimitReached, parseBudget } from './run-budget'

describe('parseBudget', () => {
  it('usa los valores por defecto si no hay nada guardado', () => {
    expect(parseBudget(null, null)).toEqual(DEFAULT_BUDGET)
  })

  it('acepta coma decimal: el operador escribe como habla', () => {
    expect(parseBudget('1,50', null).perRun).toBe(1.5)
  })

  it('ignora basura y vuelve al valor por defecto', () => {
    expect(parseBudget('mucho', null).perRun).toBe(DEFAULT_BUDGET.perRun)
    expect(parseBudget('-5', null).perRun).toBe(DEFAULT_BUDGET.perRun)
  })

  it('acota una cifra absurda: un tope de un millon no es un tope', () => {
    expect(parseBudget('999999', null).perRun).toBe(1000)
  })

  it('cero es valido y significa sin tope', () => {
    expect(parseBudget('0', '0')).toEqual({ perRun: 0, perDay: 0 })
  })
})

describe('dayLimitReached', () => {
  it('deja pasar mientras quepa', () => {
    expect(dayLimitReached({ perRun: 3, perDay: 10 }, 4.2)).toBeNull()
  })

  it('corta al llegar, y dice cuanto llevas', () => {
    const motivo = dayLimitReached({ perRun: 3, perDay: 10 }, 10)
    expect(motivo).toContain('$10.00 de $10.00')
  })

  it('con el tope en cero no corta nunca', () => {
    expect(dayLimitReached({ perRun: 3, perDay: 0 }, 500)).toBeNull()
  })
})
