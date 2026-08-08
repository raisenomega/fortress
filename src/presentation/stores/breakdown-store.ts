import { create } from 'zustand'

interface BreakdownState {
  /** Solo un desglose abierto a la vez: el id del proyecto, o null. */
  readonly openProjectId: string | null
  toggle: (projectId: string) => void
  close: () => void
}

export const useBreakdownStore = create<BreakdownState>((set) => ({
  openProjectId: null,

  toggle: (projectId) =>
    set((state) => ({ openProjectId: state.openProjectId === projectId ? null : projectId })),

  close: () => set({ openProjectId: null })
}))
