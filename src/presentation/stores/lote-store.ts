import { create } from 'zustand'
import { alternarEnLote } from '@domain/chat/lote-del-terminal'

/** Lo vacio, con referencia estable: un `Set` nuevo en cada lectura haria que
 *  zustand viera siempre un snapshot distinto. */
export const LOTE_VACIO: ReadonlySet<string> = new Set()

interface LoteState {
  readonly seleccion: Readonly<Record<string, ReadonlySet<string>>>
  /** Devuelve false si el tope lo impidio, para que la vista avise. */
  alternar: (projectId: string, findingId: string) => boolean
  limpiar: (projectId: string) => void
}

/**
 * La seleccion del LOTE al Terminal, por proyecto (ADR-088). Store propio y no el
 * de `tablero-store`: aquella es la de «Verificar mitigados» (ADR-087) y esta la
 * de resolver abiertos. Juntas, limpiar una borraria la otra, y la barra de
 * verificar contaria hallazgos que no se pueden verificar.
 */
export const useLoteStore = create<LoteState>((set, get) => ({
  seleccion: {},

  alternar: (projectId, findingId) => {
    const previo = get().seleccion[projectId] ?? LOTE_VACIO
    const { seleccion, lleno } = alternarEnLote(previo, findingId)
    if (!lleno) set((s) => ({ seleccion: { ...s.seleccion, [projectId]: seleccion } }))
    return !lleno
  },

  limpiar: (projectId) => set((s) => ({ seleccion: { ...s.seleccion, [projectId]: LOTE_VACIO } }))
}))
