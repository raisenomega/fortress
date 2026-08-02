import { describe, expect, it } from 'vitest'
import { EMPTY_USAGE } from '../telemetry/token-usage'
import { consolidate, participants, unreadable } from './workflow-result'
import type { StepResult } from './workflow-result'

const sql = { severity: 'CRITICAL', title: 'SQL injection', file: 'api.py', line: 42 } as const
const muerto = { severity: 'LOW', title: 'Funcion sin usar', file: 'utils.ts', line: 9 } as const

const step = (overrides: Partial<StepResult>): StepResult => ({
  agentId: 'security-reviewer',
  text: '',
  findings: [],
  reportRead: true,
  failed: false,
  usage: EMPTY_USAGE,
  ...overrides
})

describe('consolidate', () => {
  it('junta los hallazgos de todos los pasos', () => {
    const salida = consolidate([
      step({ findings: [sql] }),
      step({ agentId: 'refactor-cleaner', findings: [muerto] })
    ])
    expect(salida).toHaveLength(2)
  })

  it('no cuenta dos veces lo que dos agentes vieron igual', () => {
    const salida = consolidate([
      step({ findings: [sql] }),
      step({ agentId: 'code-reviewer', findings: [sql] })
    ])
    expect(salida).toEqual([sql])
  })

  it('mantiene el orden en que se encontraron', () => {
    const salida = consolidate([step({ findings: [muerto, sql] })])
    expect(salida[0]).toBe(muerto)
  })
})

describe('participants', () => {
  it('lista cada agente una sola vez', () => {
    const lista = participants([step({}), step({}), step({ agentId: 'cognition' })])
    expect(lista).toEqual(['security-reviewer', 'cognition'])
  })
})

describe('unreadable', () => {
  it('senala a quien no devolvio informe legible', () => {
    // Sin esto, un agente que fallo el formato pareceria haber salido limpio.
    const lista = unreadable([step({}), step({ agentId: 'planner', reportRead: false })])
    expect(lista).toEqual(['planner'])
  })
})
