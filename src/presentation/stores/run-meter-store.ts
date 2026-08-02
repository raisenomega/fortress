import { create } from 'zustand'

interface RunMeterState {
  /** Momento de arranque, para el cronometro. Null cuando no corre nada. */
  readonly startedAt: number | null
  readonly step: number
  readonly total: number
  readonly tokens: number
  readonly costUsd: number
  begin: (startedAt: number) => void
  progress: (step: number, total: number, tokens: number, costUsd: number) => void
  end: () => void
}

export const useRunMeterStore = create<RunMeterState>((set) => ({
  startedAt: null,
  step: 0,
  total: 0,
  tokens: 0,
  costUsd: 0,
  begin: (startedAt) => set({ startedAt, step: 0, total: 0, tokens: 0, costUsd: 0 }),
  progress: (step, total, tokens, costUsd) => set({ step, total, tokens, costUsd }),
  end: () => set({ startedAt: null })
}))
