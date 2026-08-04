import { describe, expect, it } from 'vitest'
import type { AgentHealth } from './agent-health'
import { compliancePercentile } from './agent-percentile'
import { sortAgents } from './agent-sort'

const a = (agentId: string, compliance: number | null, discrepancies = 0): AgentHealth => ({
  agentId,
  name: agentId,
  runs: compliance === null ? 0 : 2,
  failed: 0,
  compliance,
  outputTokens: 0,
  tokensPerRun: null,
  discrepancies,
  lastAt: null
})

describe('sortAgents', () => {
  it('ordena por discrepancias desc y no muta el original', () => {
    const list = [a('x', 90, 1), a('y', 80, 5), a('z', 70, 0)]
    const sorted = sortAgents(list, 'discrepancies', false)
    expect(sorted.map((s) => s.agentId)).toEqual(['y', 'x', 'z'])
    expect(list[0].agentId).toBe('x') // intacto
  })

  it('los sin dato (null) van al final', () => {
    const sorted = sortAgents([a('con', 50), a('sin', null)], 'compliance', true)
    expect(sorted[sorted.length - 1].agentId).toBe('sin')
  })
})

describe('compliancePercentile', () => {
  it('el mejor del sistema queda en el percentil 100', () => {
    const list = [a('top', 90), a('mid', 60), a('low', 30)]
    expect(compliancePercentile(list, 'top')).toBe(100)
    expect(compliancePercentile(list, 'low')).toBe(33)
  })

  it('un agente sin datos no tiene percentil', () => {
    expect(compliancePercentile([a('sin', null)], 'sin')).toBeNull()
  })
})
