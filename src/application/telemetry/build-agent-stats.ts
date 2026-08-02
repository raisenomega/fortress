import type { AgentId } from '@domain/agent/agent'
import type { Activity } from '@domain/telemetry/activity'
import type { AgentRunTotals } from '@domain/telemetry/agent-run'
import { findingOutcome, type FindingOutcome } from '@domain/telemetry/agent-stats'
import type { AppContext } from '../context'

const RECENT = 10

export interface AgentStats {
  readonly agentId: AgentId
  readonly totals: AgentRunTotals
  readonly outcome: FindingOutcome
  /** Ultimas intervenciones, de la mas reciente a la mas antigua. */
  readonly recent: readonly Activity[]
}

/**
 * Todo lo que el panel de un agente necesita, en una sola llamada. El ambito
 * es el proyecto activo: preguntar "que ha hecho este agente" sin decir donde
 * mezclaria repos que no tienen nada que ver.
 */
export function buildAgentStats(
  context: AppContext,
  agentId: AgentId,
  projectId: string
): AgentStats {
  return {
    agentId,
    totals: context.runs.totalsFor(agentId, projectId),
    outcome: findingOutcome(
      context.activity.reportedFindings(agentId, projectId),
      context.findings.listByProject(projectId)
    ),
    recent: context.activity.listByAgent(agentId, projectId, RECENT)
  }
}
