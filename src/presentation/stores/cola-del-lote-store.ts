import { create } from 'zustand'

export interface LoteEnCurso {
  readonly projectId: string
  readonly hechos: number
  readonly total: number
}

interface ColaState {
  /** El lote que corre, si hay uno. Uno a la vez: el operador sigue uno. */
  readonly enCurso: LoteEnCurso | null
  /** Detener lo levanta: la cola no lanza el siguiente. */
  readonly cortado: boolean
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

  arrancar: (projectId, total) => set({ enCurso: { projectId, hechos: 0, total }, cortado: false }),

  avanzar: () =>
    set((s) =>
      s.enCurso === null ? s : { enCurso: { ...s.enCurso, hechos: s.enCurso.hechos + 1 } }
    ),

  // Solo corta el lote de ESE proyecto: Detener en otro no toca este.
  cortar: (projectId) => set((s) => (s.enCurso?.projectId === projectId ? { cortado: true } : s)),

  terminar: () => set({ enCurso: null, cortado: false })
}))
