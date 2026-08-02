import { create } from 'zustand'
import type { AgentStats } from '@application/telemetry/build-agent-stats'

interface AgentStatsState {
  readonly stats: AgentStats | null
  readonly loading: boolean
  setStats: (stats: AgentStats | null) => void
  setLoading: (loading: boolean) => void
}

export const useAgentStatsStore = create<AgentStatsState>((set) => ({
  stats: null,
  loading: false,
  setStats: (stats) => set({ stats, loading: false }),
  setLoading: (loading) => set({ loading })
}))
