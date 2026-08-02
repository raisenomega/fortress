import { describe, expect, it } from 'vitest'
import { EMPTY_USAGE } from '../telemetry/token-usage'
import { buildWorkflowReport } from './workflow-report'
import { findWorkflow } from './workflow-catalog'
import type { StepResult } from './workflow-result'

const seguridad = findWorkflow('seguridad')

const step = (overrides: Partial<StepResult>): StepResult => ({
  agentId: 'security-reviewer',
  text: '',
  findings: [],
  reportRead: true,
  failed: false,
  usage: EMPTY_USAGE,
  ...overrides
})

const sql = { severity: 'CRITICAL', title: 'SQL injection', file: 'api.py', line: 42 } as const
const low = { severity: 'LOW', title: 'console.log', file: 'app.ts', line: 3 } as const

describe('buildWorkflowReport', () => {
  it('agrupa los hallazgos por severidad, lo urgente primero', () => {
    const informe = buildWorkflowReport(seguridad, {
      results: [step({ findings: [low, sql] })],
      stoppedBy: null
    })
    expect(informe.indexOf('### CRITICAL')).toBeLessThan(informe.indexOf('### LOW'))
  })

  it('nombra a los agentes que participaron, en orden', () => {
    const informe = buildWorkflowReport(seguridad, {
      results: [step({}), step({ agentId: 'cognition' })],
      stoppedBy: null
    })
    expect(informe).toContain('Security Reviewer → Cognition')
  })

  it('explica por que se detuvo, no lo deja en silencio', () => {
    const informe = buildWorkflowReport(seguridad, {
      results: [step({ findings: [sql] })],
      stoppedBy: 'security-reviewer'
    })
    expect(informe).toContain('Detenido tras Security Reviewer')
  })

  it('un informe ilegible NO se cuenta como limpio', () => {
    const informe = buildWorkflowReport(seguridad, {
      results: [step({ agentId: 'planner', reportRead: false })],
      stoppedBy: null
    })
    expect(informe).toContain('Sin informe legible de: Planner')
    expect(informe).toContain('No cuentan como limpios')
  })

  it('un proyecto limpio lo dice y puntua 100', () => {
    const informe = buildWorkflowReport(seguridad, { results: [step({})], stoppedBy: null })
    expect(informe).toContain('100/100')
    expect(informe).toContain('sin hallazgos')
  })
})
