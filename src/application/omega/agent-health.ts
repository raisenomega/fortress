import { AGENT_CATALOG } from '@domain/agent/agent-catalog'
import type { AgentHealth } from '@domain/omega/agent-health'
import type { AppContext } from '../context'

/**
 * Salud de cada agente del catalogo con datos reales de su telemetria en este
 * proyecto: ejecuciones, fallos, cumplimiento, tokens, ultima actividad. Es la
 * vista macro del superdashboard, sin una sola cifra inventada.
 */
export function agentHealth(context: AppContext, projectId: string): readonly AgentHealth[] {
  const log = context.omegaLog.listByProject(projectId, 500)
  const discrepancies = (agentId: string): number =>
    log.filter((e) => e.agentId === agentId && e.verdict === 'discrepancia').length

  return AGENT_CATALOG.map((agent) => {
    const t = context.runs.totalsFor(agent.id, projectId)
    return {
      agentId: agent.id,
      name: agent.name,
      runs: t.runs,
      failed: t.failed,
      compliance: t.runs === 0 ? null : Math.round((100 * (t.runs - t.failed)) / t.runs),
      outputTokens: t.usage.outputTokens,
      tokensPerRun: t.runs === 0 ? null : Math.round(t.usage.outputTokens / t.runs),
      discrepancies: discrepancies(agent.id),
      lastAt: t.lastAt
    }
  })
}
