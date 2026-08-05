import { create } from 'zustand'

/** Fases del flujo de construir: el plan (review) se aprueba antes de escribir. */
export type BuildPhase = 'idle' | 'planning' | 'review' | 'building' | 'done' | 'error'

interface BuildState {
  readonly intent: string
  readonly phase: BuildPhase
  readonly plan: string
  readonly message: string
  setIntent: (intent: string) => void
  toPlanning: () => void
  toReview: (plan: string) => void
  toBuilding: () => void
  toDone: (message: string) => void
  toError: (message: string) => void
  reset: () => void
}

export const useConstruirStore = create<BuildState>((set) => ({
  intent: '',
  phase: 'idle',
  plan: '',
  message: '',
  setIntent: (intent) => set({ intent }),
  toPlanning: () => set({ phase: 'planning', message: '' }),
  toReview: (plan) => set({ phase: 'review', plan }),
  toBuilding: () => set({ phase: 'building' }),
  toDone: (message) => set({ phase: 'done', message }),
  toError: (message) => set({ phase: 'error', message }),
  reset: () => set({ intent: '', phase: 'idle', plan: '', message: '' })
}))
