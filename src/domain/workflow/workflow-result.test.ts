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
  tools: [],
  edits: [],
  durationMs: 0,
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

  it('no cuenta dos veces lo mismo, y el merito es del primero que lo vio', () => {
    const salida = consolidate([
      step({ findings: [sql] }),
      step({ agentId: 'code-reviewer', findings: [sql] })
    ])
    expect(salida).toHaveLength(1)
    expect(salida[0].agentId).toBe('security-reviewer')
  })

  it('cada hallazgo sale atribuido al agente que lo reporto', () => {
    // El bug: un LOW de Cognition aparecia sin decir que era suyo, y parecia
    // de Code Reviewer, que ni siquiera habia devuelto informe legible.
    const salida = consolidate([step({ agentId: 'cognition', findings: [muerto] })])
    expect(salida[0]).toMatchObject({ title: muerto.title, agentId: 'cognition' })
  })

  it('mantiene el orden en que se encontraron', () => {
    const salida = consolidate([step({ findings: [muerto, sql] })])
    expect(salida[0].title).toBe(muerto.title)
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
