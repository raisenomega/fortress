import { create } from 'zustand'
import type { Proposal } from '@domain/repair/proposal'

interface MotorState {
  /**
   * A que proyecto pertenecen las propuestas cargadas. Sin este campo, cambiar
   * de proyecto pintaria el estado del anterior hasta que llegue la carga
   * nueva, y ese hueco es justo cuando el operador esta mirando la barra.
   */
  readonly projectId: string | null
  readonly proposals: readonly Proposal[]
  setProposals: (projectId: string, proposals: readonly Proposal[]) => void
}

/**
 * Slot propio del indicador de la barra: habla del proyecto ACTIVO. Aparte de
 * `useRepairStore` a proposito — aquel guarda el expediente del repo propio y
 * la vista de Auto-mejora lo lee; compartirlo haria que una vista dijera del
 * repo propio lo que en realidad es de otro proyecto.
 */
export const useMotorStore = create<MotorState>((set) => ({
  projectId: null,
  proposals: [],
  setProposals: (projectId, proposals) => set({ projectId, proposals })
}))
