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

/** True si el loop del proyecto esta corriendo (reporto y aun no ha parado). */
export function useLoopActive(projectId: string | null): boolean {
  return useLoopStore((state) => {
    const status = projectId ? state.byProject[projectId] : null
    return status !== undefined && status !== null && status.stopReason === null
  })
}
