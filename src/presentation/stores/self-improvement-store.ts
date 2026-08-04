import { create } from 'zustand'
import type { SelfObservation } from '@domain/system/self-observation'

interface SelfImprovementState {
  readonly observations: readonly SelfObservation[]
  setObservations: (list: readonly SelfObservation[]) => void
}

export const useSelfImprovementStore = create<SelfImprovementState>((set) => ({
  observations: [],
  setObservations: (observations) => set({ observations })
}))

/** Pendientes de FORTRESS abiertos, los que dejaron los agentes en otros proyectos. */
export function useSelfObservations(): readonly SelfObservation[] {
  return useSelfImprovementStore((state) => state.observations)
}
