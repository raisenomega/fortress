import { create } from 'zustand'

/** El hallazgo que el operador mando a resolver desde su fila (ADR-088, pieza 2). */
export interface FocoDelTerminal {
  readonly projectId: string
  readonly findingId: string
}

interface WorkflowState {
  /** Mensaje esperando aprobacion del plan, en modo supervisado. */
  readonly pendingPrompt: string | null
  /** Texto precargado en el chat desde otra pantalla. */
  readonly draft: string
  /**
   * El foco del Terminal. Vive aparte del mensaje pendiente a proposito: asi
   * sobrevive a la espera de aprobacion, y al enviar (o cancelar) se limpia.
   */
  readonly foco: FocoDelTerminal | null
  setPending: (prompt: string | null) => void
  setDraft: (draft: string) => void
  setFoco: (foco: FocoDelTerminal | null) => void
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  pendingPrompt: null,
  draft: '',
  foco: null,
  setPending: (pendingPrompt) => set({ pendingPrompt }),
  setDraft: (draft) => set({ draft }),
  setFoco: (foco) => set({ foco })
}))
