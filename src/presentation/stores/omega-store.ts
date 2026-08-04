import { create } from 'zustand'
import type { AgentHealth } from '@domain/omega/agent-health'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import type { OmegaScore } from '@domain/omega/omega-score'
import type { AgentRun } from '@domain/telemetry/agent-run'

interface OmegaData {
  readonly log: readonly OmegaEntry[]
  readonly score: OmegaScore | null
  readonly agents: readonly AgentHealth[]
  readonly runs: readonly AgentRun[]
}

interface OmegaState {
  readonly byProject: Readonly<Record<string, OmegaData>>
  /** Proyecto que OMEGA esta auditando ahora, o null. */
  readonly auditing: string | null
  /** Agente cuyo perfil esta abierto en el dashboard, o null. */
  readonly selectedAgent: string | null
  setData: (projectId: string, data: OmegaData) => void
  setAuditing: (projectId: string | null) => void
  selectAgent: (agentId: string | null) => void
}

const EMPTY: OmegaData = { log: [], score: null, agents: [], runs: [] }

export const useOmegaStore = create<OmegaState>((set) => ({
  byProject: {},
  auditing: null,
  selectedAgent: null,
  setData: (projectId, data) =>
    set((state) => ({ byProject: { ...state.byProject, [projectId]: data } })),
  setAuditing: (auditing) => set({ auditing }),
  selectAgent: (selectedAgent) => set({ selectedAgent })
}))

/** Referencia estable por proyecto: un objeto nuevo por render meteria a React en bucle. */
export function useOmega(projectId: string | null): OmegaData {
  return useOmegaStore((state) => (projectId ? (state.byProject[projectId] ?? EMPTY) : EMPTY))
}
