import { create } from 'zustand'
import type { LoopStatus } from '@domain/loop/loop-status'

interface LoopStoreState {
  readonly byProject: Readonly<Record<string, LoopStatus>>
  setStatus: (status: LoopStatus) => void
}

export const useLoopStore = create<LoopStoreState>((set) => ({
  byProject: {},
  setStatus: (status) =>
    set((state) => ({ byProject: { ...state.byProject, [status.projectId]: status } }))
}))

/** Estado del loop de un proyecto, o null si nunca reporto (aislado por proyecto). */
export function useLoopStatus(projectId: string | null): LoopStatus | null {
  return useLoopStore((state) => (projectId ? (state.byProject[projectId] ?? null) : null))
}
