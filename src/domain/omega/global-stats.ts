import type { AgentHealth } from './agent-health'

/** Resultados globales del sistema (spec §7), sumados de datos reales. */
export interface GlobalStats {
  readonly totalRuns: number
  readonly failedRuns: number
  readonly totalTokens: number
  /** Mejores y peores por confiabilidad; solo agentes con datos. */
  readonly top: readonly AgentHealth[]
  readonly bottom: readonly AgentHealth[]
}

const sum = (agents: readonly AgentHealth[], pick: (a: AgentHealth) => number): number =>
  agents.reduce((total, agent) => total + pick(agent), 0)

export function globalStats(agents: readonly AgentHealth[]): GlobalStats {
  const ranked = agents
    .filter((a) => a.compliance !== null)
    .sort((a, b) => (b.compliance ?? 0) - (a.compliance ?? 0))

  return {
    totalRuns: sum(agents, (a) => a.runs),
    failedRuns: sum(agents, (a) => a.failed),
    totalTokens: sum(agents, (a) => a.outputTokens),
    top: ranked.slice(0, 3),
    bottom: ranked.slice(-3).reverse()
  }
}
