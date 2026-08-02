import { create } from 'zustand'
import { EMPTY_SNAPSHOT, type CognitionSnapshot } from '@domain/cognition/cognition-log'

interface CognitionState {
  readonly byProject: Readonly<Record<string, CognitionSnapshot>>
  setSnapshot: (projectId: string, snapshot: CognitionSnapshot) => void
}

export const useCognitionStore = create<CognitionState>((set) => ({
  byProject: {},
  setSnapshot: (projectId, snapshot) =>
    set((state) => ({ byProject: { ...state.byProject, [projectId]: snapshot } }))
}))

/** Referencia estable: un objeto nuevo por render meteria a React en bucle. */
export function useCognition(projectId: string | null): CognitionSnapshot {
  return useCognitionStore((state) =>
    projectId ? (state.byProject[projectId] ?? EMPTY_SNAPSHOT) : EMPTY_SNAPSHOT
  )
}
