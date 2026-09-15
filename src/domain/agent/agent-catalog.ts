import type { Agent, AgentId } from './agent'
import { DEFAULT_AGENTS } from './default-agents'
import { OPTIONAL_AGENTS } from './optional-agents'
import { PRODUCTOR } from './productor'

/**
 * Catalogo fijo de agentes, en el orden en que se listan en la barra lateral:
 * primero los que vienen activos, despues los opcionales.
 */
export const AGENT_CATALOG: readonly Agent[] = [...DEFAULT_AGENTS, ...OPTIONAL_AGENTS]

export function findAgent(id: AgentId): Agent | undefined {
  return AGENT_CATALOG.find((agent) => agent.id === id)
}

/** Si el operador puede dejarlo fuera desde el sidebar. El productor no: sin el,
 *  el turno de resolucion se quedaria sin quien produzca (ADR-088, Enmienda 2). */
export function esInterruptor(agent: Agent): boolean {
  return agent.id !== PRODUCTOR.id
}
