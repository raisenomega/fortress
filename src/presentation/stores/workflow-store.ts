import { create } from 'zustand'

interface WorkflowState {
  /** Mensaje esperando aprobacion del plan, en modo supervisado. */
  readonly pendingPrompt: string | null
  /** Paso en curso, para pintar el avance. */
  readonly step: { readonly index: number; readonly total: number } | null
  /** Texto precargado en el chat desde otra pantalla. */
  readonly draft: string
  setPending: (prompt: string | null) => void
  setStep: (step: { index: number; total: number } | null) => void
  setDraft: (draft: string) => void
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  pendingPrompt: null,
  step: null,
  draft: '',
  setPending: (pendingPrompt) => set({ pendingPrompt }),
  setStep: (step) => set({ step }),
  setDraft: (draft) => set({ draft })
}))
