import type { AgentHealth } from '@domain/omega/agent-health'
import { compliancePercentile } from '@domain/omega/agent-percentile'
import type { ProfileMetric } from './OmegaMetricsTable'

/** Filas de la tabla de metricas del agente (spec §3), con datos reales. */
export function pageMetrics(
  agent: AgentHealth,
  agents: readonly AgentHealth[]
): readonly ProfileMetric[] {
  const conf = agent.compliance === null ? 's/d' : `${agent.compliance}%`
  const pct = compliancePercentile(agents, agent.agentId)
  const efic = agent.tokensPerRun === null ? 's/d' : `${agent.tokensPerRun} tok/ejec`

  return [
    { label: 'Confiabilidad', value: conf, percentil: pct === null ? 's/d' : `${pct}%` },
    { label: 'Eficiencia', value: efic, percentil: 's/d' },
    { label: 'Profundidad', value: 's/d', percentil: 's/d' },
    { label: 'Discrepancias', value: String(agent.discrepancies), percentil: 's/d' },
    { label: 'Cumplimiento', value: conf, percentil: 's/d' }
  ]
}
