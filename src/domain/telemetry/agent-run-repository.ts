import type { AgentId } from '../agent/agent'
import type { AgentRanking, AgentRun, AgentRunTotals, NewAgentRun } from './agent-run'
import type { TokenUsage } from './token-usage'

/** Puerto de la telemetria de ejecuciones. La infraestructura lo implementa. */
export interface AgentRunRepository {
  record(run: NewAgentRun): AgentRun

  /** Ultimas ejecuciones de un proyecto, de la mas reciente a la mas antigua. */
  listByProject(projectId: string, limit: number): readonly AgentRun[]

  /** Ultimas ejecuciones de un agente cruzando proyectos (para su pagina). */
  listByAgent(agentId: string, limit: number): readonly AgentRun[]

  /** Acumulado de un agente; con projectId en null, en todos los proyectos. */
  totalsFor(agentId: AgentId, projectId: string | null): AgentRunTotals

  /** Consumo desde una fecha ISO. Alimenta el "hoy / semana / mes". */
  usageSince(since: string): TokenUsage

  usageByProjectSince(since: string): Readonly<Record<string, TokenUsage>>

  /** Agentes mas activos desde una fecha. */
  rankingSince(since: string, limit: number): readonly AgentRanking[]

  /** Coste y duracion medios por ejecucion en un proyecto, o null sin datos. */
  averageRun(projectId: string): { readonly seconds: number; readonly usd: number } | null
}
