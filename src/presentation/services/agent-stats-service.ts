import type { AgentId } from '@domain/agent/agent'
import { api } from '../adapters/fortress-api'
import { useAgentStatsStore } from '../stores/agent-stats-store'

/** Carga el detalle de un agente en el proyecto activo. */
export async function loadAgentStats(agentId: AgentId, projectId: string): Promise<void> {
  const store = useAgentStatsStore.getState()
  store.setLoading(true)

  try {
    store.setStats(await api().activity.stats(agentId, projectId))
  } catch {
    // Sin datos el modal lo dice; no tiene sentido tumbar la UI por esto.
    useAgentStatsStore.getState().setStats(null)
  }
}
