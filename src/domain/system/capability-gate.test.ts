import { describe, expect, it } from 'vitest'
import type { ScoreInputs } from '../omega/omega-score'
import { omegaGate } from './capability-gate'

function inputs(runs: number, failedRuns: number): ScoreInputs {
  return { okChecks: 0, discrepancies: 0, runs, failedRuns, outputTokens: 0, verifiedFindings: 0 }
}

describe('omegaGate', () => {
  it('ejecuciones limpias: OMEGA no veta', () => {
    const v = omegaGate(inputs(20_000, 0))
    expect(v.vetoed).toBe(false)
    expect(v.reason).toBeNull()
  })

  it('demasiados fallos: OMEGA veta con la banda como evidencia', () => {
    const v = omegaGate(inputs(100, 50))
    expect(v.vetoed).toBe(true)
    expect(v.band).toBe('no-confiable')
    expect(v.reason).toContain('50/100')
  })

  it('sin evidencia (0 ejecuciones): silencio, no veto ni aprobacion', () => {
    const v = omegaGate(inputs(0, 0))
    expect(v.vetoed).toBe(false)
    expect(v.band).toBe('sin-datos')
  })
})
