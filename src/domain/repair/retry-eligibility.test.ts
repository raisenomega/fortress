import { describe, expect, it } from 'vitest'
import { isRetryable, RETRYABLE_REJECTION_REASONS } from './retry-eligibility'
import type { ProposalState } from './proposal'

const OTROS: readonly ProposalState[] = ['ELEGIDO', 'ANALIZADO', 'GENERADO', 'GATE', 'OMEGA', 'APROBADO', 'MERGEADO', 'CADUCADO'] // prettier-ignore

describe('isRetryable (D24)', () => {
  it('solo RECHAZADO puede reintentarse, jamas otro estado', () => {
    for (const state of OTROS) {
      expect(isRetryable(state, 'omega_vetado')).toBe(false)
    }
  })

  it('las 4 razones de razonamiento son reintentables, tal cual', () => {
    for (const reason of RETRYABLE_REJECTION_REASONS) {
      expect(isRetryable('RECHAZADO', reason)).toBe(true)
    }
  })

  it('la forma REAL persistida de omega_vetado (con sufijo) tambien', () => {
    expect(isRetryable('RECHAZADO', 'omega_vetado: el fix no cubre la fuga de listado')).toBe(true)
  })

  it('los fallos tecnicos NO: repetir sin arreglar la causa da lo mismo', () => {
    for (const reason of [
      'budget_exceeded',
      'worktree_missing',
      'worktree_contaminated',
      'gate_timeout',
      'gate_failed_at=test:unit',
      'omega_timeout',
      'omega_error',
      'omega_response_invalid',
      'npm_ci_failed',
      'orphan_before_generate',
      'superseded'
    ]) {
      // prettier-ignore
      expect(isRetryable('RECHAZADO', reason)).toBe(false)
    }
  })

  it('sin razon (null/undefined) no hay reintento', () => {
    expect(isRetryable('RECHAZADO', null)).toBe(false)
    expect(isRetryable('RECHAZADO', undefined)).toBe(false)
  })

  it('un prefijo parcial no engana al matcheo ("omega_vetadox" no es vetado)', () => {
    expect(isRetryable('RECHAZADO', 'omega_vetadox')).toBe(false)
    expect(isRetryable('RECHAZADO', 'scope_violation_extra')).toBe(false)
  })
})
