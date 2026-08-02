import type { Agent, AgentId } from './agent'
import { DEFAULT_AGENTS } from './default-agents'
import { OPTIONAL_AGENTS } from './optional-agents'

/**
 * Catalogo fijo de agentes, en el orden en que se listan en la barra lateral:
 * primero los que vienen activos, despues los opcionales.
 */
export const AGENT_CATALOG: readonly Agent[] = [...DEFAULT_AGENTS, ...OPTIONAL_AGENTS]

export function findAgent(id: AgentId): Agent | undefined {
  return AGENT_CATALOG.find((agent) => agent.id === id)
}
