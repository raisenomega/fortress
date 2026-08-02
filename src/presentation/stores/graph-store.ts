import { create } from 'zustand'
import { NOT_INSTALLED, type GraphStatus } from '@domain/graph/graph-status'

interface GraphState {
  readonly byProject: Readonly<Record<string, GraphStatus>>
  setStatus: (projectId: string, status: GraphStatus) => void
}

export const useGraphStore = create<GraphState>((set) => ({
  byProject: {},
  setStatus: (projectId, status) =>
    set((state) => ({ byProject: { ...state.byProject, [projectId]: status } }))
}))

/** Referencia estable para lo desconocido: evita el bucle de render. */
export function useGraph(projectId: string | null): GraphStatus {
  return useGraphStore((state) =>
    projectId ? (state.byProject[projectId] ?? NOT_INSTALLED) : NOT_INSTALLED
  )
}
