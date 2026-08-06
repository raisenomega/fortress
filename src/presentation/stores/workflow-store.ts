import { create } from 'zustand'

interface WorkflowState {
  /** Mensaje esperando aprobacion del plan, en modo supervisado. */
  readonly pendingPrompt: string | null
  /** Texto precargado en el chat desde otra pantalla. */
  readonly draft: string
  setPending: (prompt: string | null) => void
  setDraft: (draft: string) => void
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  pendingPrompt: null,
  draft: '',
  setPending: (pendingPrompt) => set({ pendingPrompt }),
  setDraft: (draft) => set({ draft })
}))
