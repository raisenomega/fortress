import { create } from 'zustand'
import type { Finding } from '@domain/project/project'
import type { Proposal } from '@domain/repair/proposal'

interface RepairState {
  /**
   * A que proyecto pertenece lo cargado. Nacio siendo siempre el propio repo
   * de FORTRESS; hoy es el proyecto ACTIVO. Quien lee compara este id con el
   * suyo antes de pintar: sin esa comprobacion, cambiar de proyecto mostraria
   * el expediente del anterior hasta que llegue la carga nueva.
   */
  readonly projectId: string | null
  readonly proposals: readonly Proposal[]
  readonly findings: readonly Finding[]
  readonly busy: boolean
  setData: (projectId: string, proposals: readonly Proposal[], findings: readonly Finding[]) => void
  setBusy: (busy: boolean) => void
}

export const useRepairStore = create<RepairState>((set) => ({
  projectId: null,
  proposals: [],
  findings: [],
  busy: false,
  setData: (projectId, proposals, findings) => set({ projectId, proposals, findings }),
  setBusy: (busy) => set({ busy })
}))
