import { create } from 'zustand'
import type { GraphAb, GraphVerify } from '@domain/graph/graph-actions'

type GraphAction = 'install' | 'verify' | 'ab'

interface GraphActionState {
  /** Accion del grafo en curso, o null. Bloquea los botones mientras corre. */
  readonly running: GraphAction | null
  readonly progress: string
  readonly verify: GraphVerify | null
  readonly ab: GraphAb | null
  readonly error: string | null
  start: (action: GraphAction) => void
  append: (delta: string) => void
  done: (patch: Partial<Pick<GraphActionState, 'verify' | 'ab' | 'error'>>) => void
}

export const useGraphActionStore = create<GraphActionState>((set) => ({
  running: null,
  progress: '',
  verify: null,
  ab: null,
  error: null,
  start: (running) => set({ running, progress: '', error: null }),
  append: (delta) => set((state) => ({ progress: state.progress + delta })),
  done: (patch) => set({ running: null, ...patch })
}))
