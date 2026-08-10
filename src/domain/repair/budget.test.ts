import { describe, expect, it } from 'vitest'
import { buildAgentRunEvent, buildTransitionEvent, type ProposalEvent } from './proposal-event'
import {
  canAffordGenerator,
  computeSpent,
  exceededBudget,
  MAX_TOKENS_PER_PROPOSAL,
  MIN_GENERATOR_BUDGET
} from './budget'

const run = (seq: number, costTokens?: number): ProposalEvent =>
  buildAgentRunEvent({ proposalId: 'p', seq, phase: 'ANALYZE', actor: 'claude-analyst', costTokens, ts: seq }) // prettier-ignore

describe('presupuesto por propuesta (R2)', () => {
  it('computeSpent suma solo AGENT_RUN e ignora costes desconocidos', () => {
    const transition = buildTransitionEvent({ proposalId: 'p', seq: 3, phase: 'SELECT', toState: 'ELEGIDO', ts: 3 }) // prettier-ignore
    expect(computeSpent([run(1, 395_199), run(2), transition])).toBe(395_199)
  })

  it('sin eventos no hay gasto', () => {
    expect(computeSpent([])).toBe(0)
  })

  it('canAfford exige margen para el generador ANTES de spawnear', () => {
    expect(canAffordGenerator(0)).toBe(true)
    expect(canAffordGenerator(MAX_TOKENS_PER_PROPOSAL - MIN_GENERATOR_BUDGET)).toBe(true)
    expect(canAffordGenerator(MAX_TOKENS_PER_PROPOSAL - MIN_GENERATOR_BUDGET + 1)).toBe(false)
  })

  it('exceededBudget juzga con la factura real en la mano', () => {
    expect(exceededBudget(1_000_000, 999_999)).toBe(false)
    expect(exceededBudget(1_000_000, 1_000_001)).toBe(true)
  })
})
