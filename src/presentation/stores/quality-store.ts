import { create } from 'zustand'
import type { IntegralScore } from '@domain/score/integral-score'

interface QualityResult {
  readonly projectId: string
  readonly score: IntegralScore
}

interface QualityState {
  /** Solo se audita un proyecto a la vez: corre probes pesados (tsc, build, test). */
  readonly runningProjectId: string | null
  readonly lastScore: QualityResult | null
  readonly lastError: { readonly projectId: string; readonly message: string } | null
  start: (projectId: string) => void
  finish: (projectId: string, score: IntegralScore | null, error: string | null) => void
}

export const useQualityStore = create<QualityState>((set) => ({
  runningProjectId: null,
  lastScore: null,
  lastError: null,

  start: (runningProjectId) => set({ runningProjectId, lastError: null }),

  finish: (projectId, score, error) =>
    set({
      runningProjectId: null,
      lastScore: score === null ? null : { projectId, score },
      lastError: error === null ? null : { projectId, message: error }
    })
}))

/** El desglose va atado a su proyecto: no mostrar el de otro al cambiar de ficha. */
export function useQualityScore(projectId: string | null): IntegralScore | null {
  return useQualityStore((state) =>
    state.lastScore && state.lastScore.projectId === projectId ? state.lastScore.score : null
  )
}
