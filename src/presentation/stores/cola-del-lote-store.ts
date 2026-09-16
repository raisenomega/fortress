import { create } from 'zustand'

export interface LoteEnCurso {
  readonly projectId: string
  readonly hechos: number
  readonly total: number
}

/** El lote con su plan precargado, esperando que el operador lo apruebe. */
export interface LotePendiente {
  readonly projectId: string
  readonly ids: readonly string[]
}

interface ColaState {
  /** El lote que corre, si hay uno. Uno a la vez: el operador sigue uno. */
  readonly enCurso: LoteEnCurso | null
  /** Detener lo levanta: la cola no lanza el siguiente. */
  readonly cortado: boolean
  /** Esperando la aprobacion del plan (ADR-088, arco 1). */
  readonly pendiente: LotePendiente | null
  preparar: (projectId: string, ids: readonly string[]) => void
  descartar: () => void
  arrancar: (projectId: string, total: number) => void
  avanzar: () => void
  cortar: (projectId: string) => void
  terminar: () => void
}

/**
 * El estado de la cola del lote (ADR-088). Aparte de la seleccion porque son dos
 * cosas: aquello es lo que el operador eligio, esto es lo que esta corriendo.
 */
export const useColaDelLoteStore = create<ColaState>((set) => ({
  enCurso: null,
  cortado: false,
  pendiente: null,

  preparar: (projectId, ids) => set({ pendiente: { projectId, ids } }),
  descartar: () => set({ pendiente: null }),

  arrancar: (projectId, total) => set({ enCurso: { projectId, hechos: 0, total }, cortado: false }),

  avanzar: () =>
    set((s) =>
      s.enCurso === null ? s : { enCurso: { ...s.enCurso, hechos: s.enCurso.hechos + 1 } }
    ),

  // Solo corta el lote de ESE proyecto: Detener en otro no toca este.
  cortar: (projectId) => set((s) => (s.enCurso?.projectId === projectId ? { cortado: true } : s)),

  terminar: () => set({ enCurso: null, cortado: false })
}))
