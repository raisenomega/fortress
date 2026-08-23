import { create } from 'zustand'
import type { Finding } from '@domain/project/project'
import type { ResumenCerco } from '@application/repair/resumen-cerco'
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
  /** El drenaje esta recorriendo los elegibles de este proyecto. */
  readonly drenando: boolean
  /** Cuantos hallazgos vivos no puede elegir la cola por si sola. */
  readonly cerco: ResumenCerco
  setData: (
    projectId: string,
    proposals: readonly Proposal[],
    findings: readonly Finding[],
    cerco: ResumenCerco
  ) => void
  setBusy: (busy: boolean) => void
  setDrenando: (drenando: boolean) => void
}

export const useRepairStore = create<RepairState>((set) => ({
  projectId: null,
  proposals: [],
  findings: [],
  busy: false,
  drenando: false,
  cerco: { total: 0, trabajables: 0, autoIntegrables: 0, elegibles: 0 },
  setData: (projectId, proposals, findings, cerco) =>
    set({ projectId, proposals, findings, cerco }),
  setBusy: (busy) => set({ busy }),
  setDrenando: (drenando) => set({ drenando })
}))
