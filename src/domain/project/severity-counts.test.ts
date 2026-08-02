import { describe, expect, it } from 'vitest'
import { countFindings, EMPTY_COUNTS, presentSeverities, totalFindings } from './severity-counts'

describe('countFindings', () => {
  it('devuelve todas las severidades a cero sin hallazgos', () => {
    expect(countFindings([])).toEqual(EMPTY_COUNTS)
  })

  it('agrupa por severidad', () => {
    const counts = countFindings([
      { severity: 'CRITICAL' },
      { severity: 'HIGH' },
      { severity: 'HIGH' }
    ])
    expect(counts).toEqual({ CRITICAL: 1, HIGH: 2, MEDIUM: 0, LOW: 0 })
  })

  it('no muta la constante compartida', () => {
    countFindings([{ severity: 'LOW' }])
    expect(EMPTY_COUNTS.LOW).toBe(0)
  })
})

describe('totalFindings', () => {
  it('suma todas las severidades', () => {
    expect(totalFindings(countFindings([{ severity: 'LOW' }, { severity: 'CRITICAL' }]))).toBe(2)
  })
})

describe('presentSeverities', () => {
  it('omite las severidades sin hallazgos y ordena por urgencia', () => {
    const counts = countFindings([{ severity: 'LOW' }, { severity: 'CRITICAL' }])
    expect(presentSeverities(counts)).toEqual(['CRITICAL', 'LOW'])
  })
})
