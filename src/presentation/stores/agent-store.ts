import { create } from 'zustand'
import { AGENT_CATALOG } from '@domain/agent/agent-catalog'
import type { AgentId } from '@domain/agent/agent'

interface AgentState {
  /**
   * Agentes EXCLUIDOS. Antes se guardaban los activos y habia que encender
   * cada uno a mano: diez decisiones para empezar a trabajar. Ahora todos
   * participan y el interruptor sirve para dejar uno fuera.
   */
  readonly excluded: readonly AgentId[]
  toggle: (id: AgentId) => void
}

export const useAgentStore = create<AgentState>((set) => ({
  excluded: [],

  toggle: (id) =>
    set((state) => ({
      excluded: state.excluded.includes(id)
        ? state.excluded.filter((current) => current !== id)
        : [...state.excluded, id]
    }))
}))

/** Referencia estable: lista vacia compartida para no romper los snapshots. */
const NINGUNO: readonly AgentId[] = []

export function useExcludedAgents(): readonly AgentId[] {
  return useAgentStore((state) => (state.excluded.length === 0 ? NINGUNO : state.excluded))
}

export function useActiveAgentCount(): number {
  return useAgentStore((state) => AGENT_CATALOG.length - state.excluded.length)
}
