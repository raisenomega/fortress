import { describe, expect, it } from 'vitest'
import type { AgentHealth } from './agent-health'
import { globalStats } from './global-stats'

const a = (id: string, compliance: number | null, runs = 2, failed = 0): AgentHealth => ({
  agentId: id,
  name: id,
  runs,
  failed,
  compliance,
  outputTokens: 100,
  tokensPerRun: 50,
  discrepancies: 0,
  lastAt: null
})

describe('globalStats', () => {
  it('suma ejecuciones, fallos y tokens de todos', () => {
    const s = globalStats([a('x', 90, 3, 1), a('y', 80, 2, 0)])
    expect(s.totalRuns).toBe(5)
    expect(s.failedRuns).toBe(1)
    expect(s.totalTokens).toBe(200)
  })

  it('rankea mejores y peores solo con datos reales', () => {
    const s = globalStats([a('top', 95), a('mid', 60), a('low', 20), a('sin', null)])
    expect(s.top[0].agentId).toBe('top')
    expect(s.bottom[0].agentId).toBe('low')
    expect(s.top.some((x) => x.agentId === 'sin')).toBe(false)
  })
})
