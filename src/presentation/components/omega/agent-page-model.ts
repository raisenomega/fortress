import type { AgentHealth } from '@domain/omega/agent-health'
import { compliancePercentile } from '@domain/omega/agent-percentile'
import type { Field } from './OmegaFieldGrid'
import type { Highlight } from './OmegaHighlights'

/** Campos informativos del agente para el grid de su pagina. Datos reales. */
export function pageFields(agent: AgentHealth): readonly Field[] {
  return [
    { label: 'Ejecuciones', value: String(agent.runs) },
    { label: 'Fallos', value: String(agent.failed) },
    { label: 'Tokens/ejec', value: agent.tokensPerRun === null ? 's/d' : String(agent.tokensPerRun) },
    { label: 'Discrepancias', value: String(agent.discrepancies) }
  ]
}

/** Los 3 destacados en linea: confiabilidad, percentil y actividad relativa. */
export function pageHighlights(
  agent: AgentHealth,
  agents: readonly AgentHealth[]
): readonly Highlight[] {
  const maxRuns = Math.max(...agents.map((a) => a.runs), 1)
  return [
    { label: 'Confiabilidad', value: agent.compliance, tone: 'bg-success' },
    { label: 'Percentil', value: compliancePercentile(agents, agent.agentId), tone: 'bg-primary' },
    { label: 'Actividad', value: Math.round((100 * agent.runs) / maxRuns), tone: 'bg-medium' }
  ]
}
