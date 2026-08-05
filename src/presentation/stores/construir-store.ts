import { create } from 'zustand'

/** Los tres modos del chat de construir: la flecha del input los ofrece. */
export type ConstruirMode = 'plan' | 'investigacion' | 'ejecutor'

export interface ConstruirMsg {
  readonly role: 'user' | 'assistant'
  readonly text: string
}

interface ConstruirState {
  readonly messages: readonly ConstruirMsg[]
  readonly input: string
  /** Ruta del archivo adjunto para que el agente lo lea, o null. */
  readonly attached: string | null
  readonly busy: boolean
  /** Ultimo plan producido; es lo que Ejecutor construye (elegirlo = aprobarlo). */
  readonly pendingPlan: { readonly intent: string; readonly plan: string } | null
  setInput: (input: string) => void
  setAttached: (attached: string | null) => void
  setBusy: (busy: boolean) => void
  push: (msg: ConstruirMsg) => void
  setPendingPlan: (p: { intent: string; plan: string } | null) => void
}

export const useConstruirStore = create<ConstruirState>((set) => ({
  messages: [],
  input: '',
  attached: null,
  busy: false,
  pendingPlan: null,
  setInput: (input) => set({ input }),
  setAttached: (attached) => set({ attached }),
  setBusy: (busy) => set({ busy }),
  push: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setPendingPlan: (pendingPlan) => set({ pendingPlan })
}))
