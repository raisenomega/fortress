import { describe, expect, it } from 'vitest'
import { solvedStreak } from './loop-decision'

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
