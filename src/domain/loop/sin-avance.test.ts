import { describe, expect, it } from 'vitest'
import { loopStop, type LoopState } from './loop-decision'
import { ESTADO_BASE as base } from './loop-decision-fixture'

describe('sin-avance: fixes que se generan y mueren', () => {
  const conDescartes = (n: number): LoopState => ({ ...base, consecutiveDiscarded: n })

  it('tres descartes seguidos paran el ciclo', () => {
    expect(loopStop(conDescartes(3))).toBe('sin-avance')
  })

  it('dos no bastan: la racha aun puede romperse', () => {
    expect(loopStop(conDescartes(2))).toBeNull()
  })

  it('no se confunde con pool-agotado: alli no habia a quien elegir', () => {
    // Vueltas en vacio con cero descartes: el freno que salta es el otro.
    const vacio = { ...base, consecutiveNoCandidates: 10, consecutiveDiscarded: 0 }
    expect(loopStop(vacio)).toBe('pool-agotado')
  })

  it('resuelto manda sobre el no-avance: un arco cerrado no es un fracaso', () => {
    expect(loopStop({ ...conDescartes(3), recentScores: [100, 100, 100] })).toBe('resuelto')
  })
})
