import { create } from 'zustand'
import { AGENT_CATALOG } from '@domain/agent/agent-catalog'
import type { AgentId } from '@domain/agent/agent'

interface AgentState {
  readonly enabled: readonly AgentId[]
  toggle: (id: AgentId) => void
  isEnabled: (id: AgentId) => boolean
}

const DEFAULT_ENABLED: readonly AgentId[] = AGENT_CATALOG.filter(
  (agent) => agent.enabledByDefault
).map((agent) => agent.id)

export const useAgentStore = create<AgentState>((set, get) => ({
  enabled: DEFAULT_ENABLED,

  toggle: (id) =>
    set((state) => ({
      enabled: state.enabled.includes(id)
        ? state.enabled.filter((current) => current !== id)
        : [...state.enabled, id]
    })),

  isEnabled: (id) => get().enabled.includes(id)
}))
