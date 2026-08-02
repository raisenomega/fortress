import { describe, expect, it } from 'vitest'
import { overallLevel, problemsOf, type HealthCheck, type HealthLevel } from './health-check'

const check = (id: string, level: HealthLevel): HealthCheck => ({
  id,
  label: id,
  level,
  detail: '',
  fix: null
})

describe('overallLevel', () => {
  it('sin checks el sistema esta OK', () => {
    expect(overallLevel([])).toBe('ok')
  })

  it('todo ok da ok', () => {
    expect(overallLevel([check('a', 'ok'), check('b', 'ok')])).toBe('ok')
  })

  it('un aviso degrada el conjunto', () => {
    expect(overallLevel([check('a', 'ok'), check('b', 'warning')])).toBe('warning')
  })

  it('un error manda por encima de cualquier aviso', () => {
    expect(overallLevel([check('a', 'warning'), check('b', 'error'), check('c', 'ok')])).toBe(
      'error'
    )
  })

  it('los ok nunca tapan un error, este donde este', () => {
    expect(overallLevel([check('a', 'error'), check('b', 'ok'), check('c', 'ok')])).toBe('error')
  })
})

describe('problemsOf', () => {
  it('devuelve solo lo que hay que arreglar', () => {
    const report = {
      level: 'error' as HealthLevel,
      checkedAt: '2026-08-01T00:00:00.000Z',
      checks: [check('a', 'ok'), check('b', 'warning'), check('c', 'error')]
    }
    expect(problemsOf(report).map((item) => item.id)).toEqual(['b', 'c'])
  })
})
