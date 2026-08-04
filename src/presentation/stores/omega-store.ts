import { create } from 'zustand'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import type { OmegaScore } from '@domain/omega/omega-score'

interface OmegaData {
  readonly log: readonly OmegaEntry[]
  readonly score: OmegaScore | null
}

interface OmegaState {
  readonly byProject: Readonly<Record<string, OmegaData>>
  /** Proyecto que OMEGA esta auditando ahora, o null. */
  readonly auditing: string | null
  setData: (projectId: string, data: OmegaData) => void
  setAuditing: (projectId: string | null) => void
}

const EMPTY: OmegaData = { log: [], score: null }

export const useOmegaStore = create<OmegaState>((set) => ({
  byProject: {},
  auditing: null,
  setData: (projectId, data) =>
    set((state) => ({ byProject: { ...state.byProject, [projectId]: data } })),
  setAuditing: (auditing) => set({ auditing })
}))

/** Referencia estable por proyecto: un objeto nuevo por render meteria a React en bucle. */
export function useOmega(projectId: string | null): OmegaData {
  return useOmegaStore((state) => (projectId ? (state.byProject[projectId] ?? EMPTY) : EMPTY))
}
