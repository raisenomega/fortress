import { create } from 'zustand'

export interface LoteEnCurso {
  readonly projectId: string
  readonly hechos: number
  readonly total: number
}

/** El lote esperando en el punto de parada (ADR-088, arco 1). */
export interface LotePendiente {
  readonly projectId: string
  readonly ids: readonly string[]
  /** El productor ya dio su plan y el turno paro: falta el disparo que ejecuta. */
  readonly planeado: boolean
}

interface ColaState {
  /** El lote que corre, si hay uno. Uno a la vez: el operador sigue uno. */
  readonly enCurso: LoteEnCurso | null
  /** Detener lo levanta: la cola no lanza el siguiente. */
  readonly cortado: boolean
  /** Esperando en el punto de parada (ADR-088, arco 1). */
  readonly pendiente: LotePendiente | null
  preparar: (projectId: string, ids: readonly string[]) => void
  /** El turno de plan termino: el lote queda listo para el disparo que ejecuta. */
  marcarPlaneado: (projectId: string) => void
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

  preparar: (projectId, ids) => set({ pendiente: { projectId, ids, planeado: false } }),

  marcarPlaneado: (projectId) =>
    set((s) =>
      s.pendiente?.projectId === projectId ? { pendiente: { ...s.pendiente, planeado: true } } : s
    ),

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
