import { create } from 'zustand'
import { alternarEnLote } from '@domain/chat/lote-del-terminal'

/** Lo vacio, con referencia estable: un `Set` nuevo en cada lectura haria que
 *  zustand viera siempre un snapshot distinto. */
export const LOTE_VACIO: ReadonlySet<string> = new Set()

interface LoteState {
  readonly seleccion: Readonly<Record<string, ReadonlySet<string>>>
  alternar: (projectId: string, findingId: string) => void
  limpiar: (projectId: string) => void
}

/**
 * La seleccion del LOTE al Terminal, por proyecto (ADR-088). Store propio y no el
 * de `tablero-store`: aquella es la de «Verificar mitigados» (ADR-087) y esta la
 * de resolver abiertos. Juntas, limpiar una borraria la otra, y la barra de
 * verificar contaria hallazgos que no se pueden verificar.
 */
export const useLoteStore = create<LoteState>((set) => ({
  seleccion: {},

  alternar: (projectId, findingId) =>
    set((s) => ({
      seleccion: {
        ...s.seleccion,
        [projectId]: alternarEnLote(s.seleccion[projectId] ?? LOTE_VACIO, findingId)
      }
    })),

  limpiar: (projectId) => set((s) => ({ seleccion: { ...s.seleccion, [projectId]: LOTE_VACIO } }))
}))
