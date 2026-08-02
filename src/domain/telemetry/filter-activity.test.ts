import { describe, expect, it } from 'vitest'
import type { Activity } from './activity'
import { filterActivity, isFiltering, NO_FILTER } from './filter-activity'

const entry = (overrides: Partial<Activity>): Activity => ({
  id: 'a1',
  projectId: 'p1',
  agentId: 'security-reviewer',
  kind: 'finding',
  summary: 'SQL injection',
  severity: 'CRITICAL',
  file: 'api.py',
  line: 42,
  at: '2026-08-02T00:00:00.000Z',
  ...overrides
})

const hallazgo = entry({})
const escaneo = entry({ id: 'a2', kind: 'scan', severity: null, summary: 'Escaneo' })
const chatDeOtro = entry({ id: 'a3', kind: 'chat', agentId: 'planner', severity: null })

const todas = [hallazgo, escaneo, chatDeOtro]

describe('filterActivity', () => {
  it('sin filtro devuelve todo', () => {
    expect(filterActivity(todas, NO_FILTER)).toHaveLength(3)
  })

  it('filtra por agente', () => {
    expect(filterActivity(todas, { ...NO_FILTER, agentId: 'planner' })).toEqual([chatDeOtro])
  })

  it('filtra por tipo de accion', () => {
    expect(filterActivity(todas, { ...NO_FILTER, kind: 'scan' })).toEqual([escaneo])
  })

  it('filtrar por severidad esconde lo que no la tiene', () => {
    // Pedir CRITICAL no puede colar entradas sin severidad "por si acaso".
    expect(filterActivity(todas, { ...NO_FILTER, severity: 'CRITICAL' })).toEqual([hallazgo])
  })

  it('combina filtros', () => {
    const filtro = { agentId: 'security-reviewer', severity: 'CRITICAL', kind: 'finding' } as const
    expect(filterActivity(todas, filtro)).toEqual([hallazgo])
  })

  it('un combinado imposible no devuelve nada', () => {
    expect(filterActivity(todas, { ...NO_FILTER, agentId: 'planner', kind: 'finding' })).toEqual([])
  })
})

describe('isFiltering', () => {
  it('distingue la vista completa de una filtrada', () => {
    expect(isFiltering(NO_FILTER)).toBe(false)
    expect(isFiltering({ ...NO_FILTER, kind: 'edit' })).toBe(true)
  })
})
