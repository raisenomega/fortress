import { create } from 'zustand'
import type { Capability } from '@domain/system/capability'
import type { SelfObservation } from '@domain/system/self-observation'

interface SelfImprovementState {
  readonly observations: readonly SelfObservation[]
  readonly capabilities: readonly Capability[]
  setObservations: (list: readonly SelfObservation[]) => void
  setCapabilities: (list: readonly Capability[]) => void
}

export const useSelfImprovementStore = create<SelfImprovementState>((set) => ({
  observations: [],
  capabilities: [],
  setObservations: (observations) => set({ observations }),
  setCapabilities: (capabilities) => set({ capabilities })
}))

/** Pendientes de FORTRESS abiertos, los que dejaron los agentes en otros proyectos. */
export function useSelfObservations(): readonly SelfObservation[] {
  return useSelfImprovementStore((state) => state.observations)
}

/** Capacidades auto-propuestas con su fase, madurez y veredicto de OMEGA. */
export function useCapabilities(): readonly Capability[] {
  return useSelfImprovementStore((state) => state.capabilities)
}
