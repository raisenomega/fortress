import { describe, expect, it } from 'vitest'
import { loopStop, solvedStreak, type LoopState } from './loop-decision'

const base: LoopState = {
  cancelled: false,
  spentSession: 0,
  costCap: 30,
  cyclesDone: 0,
  maxCycles: 5,
  recentScores: []
}

describe('loopStop', () => {
  it('sigue cuando no se cumple ninguna parada', () => {
    expect(loopStop(base)).toBeNull()
  })

  it('la intervencion humana manda sobre todo, incluso si esta resuelto', () => {
    expect(loopStop({ ...base, cancelled: true, recentScores: [100, 100, 100] })).toBe('detenido')
  })

  it('para al alcanzar el tope de gasto', () => {
    expect(loopStop({ ...base, spentSession: 30 })).toBe('tope-gasto')
  })

  it('el gasto manda sobre el tope de ciclos', () => {
    expect(loopStop({ ...base, spentSession: 31, cyclesDone: 9 })).toBe('tope-gasto')
  })

  it('para al alcanzar el maximo de ciclos', () => {
    expect(loopStop({ ...base, cyclesDone: 5 })).toBe('tope-ciclos')
  })

  it('para con 3 escaneos 100 seguidos', () => {
    expect(loopStop({ ...base, recentScores: [100, 100, 100] })).toBe('resuelto')
  })

  it('NO para si los 100 no son 3 seguidos', () => {
    expect(loopStop({ ...base, recentScores: [100, 100, 98, 100] })).toBeNull()
  })

  it('NO para con menos de 3 escaneos aunque sean 100', () => {
    expect(loopStop({ ...base, recentScores: [100, 100] })).toBeNull()
  })
})

describe('solvedStreak', () => {
  it('cuenta los 100 SEGUIDOS desde el mas reciente, tope 3', () => {
    expect(solvedStreak([100])).toBe(1)
    expect(solvedStreak([100, 100])).toBe(2)
    expect(solvedStreak([100, 100, 100, 100])).toBe(3) // topado en 3
  })

  it('un score < 100 rompe la racha (deben ser seguidos, no aislados)', () => {
    expect(solvedStreak([100, 98, 100])).toBe(1) // solo el mas reciente
    expect(solvedStreak([90, 100, 100])).toBe(0) // el mas reciente no es 100
  })
})
