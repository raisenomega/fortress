import { create } from 'zustand'
import { guardarAbierta, guardarExpandidas, leerAbierta, leerExpandidas } from './almacen-de-la-barra' // prettier-ignore

/** Store PROPIO de la barra del Chat (PASO 116): ni una pizca de estado
 *  compartido con la barra principal (useSidebarStore queda intacto). */
interface BarraState {
  readonly abierta: boolean
  /** La SELECCION VIVA: el hilo que manda sobre la rehidratacion-por-par. */
  readonly seleccion: string | null
  /** Revision A, el acordeon: carpetas DESPLEGADAS en el arbol (persistido). */
  readonly expandidas: readonly string[]
  toggle: () => void
  setSeleccion: (seleccion: string | null) => void
  /** Clic en la fila de una carpeta: despliega/pliega — JAMAS entra al chat. */
  toggleCarpeta: (carpetaId: string) => void
}

export const useBarraStore = create<BarraState>((set) => ({
  abierta: leerAbierta(),
  seleccion: null,
  expandidas: leerExpandidas(),
  toggle: () =>
    set((s) => {
      guardarAbierta(!s.abierta)
      return { abierta: !s.abierta }
    }),
  setSeleccion: (seleccion) => set({ seleccion }),
  toggleCarpeta: (carpetaId) =>
    set((s) => {
      const expandidas = s.expandidas.includes(carpetaId)
        ? s.expandidas.filter((id) => id !== carpetaId)
        : [...s.expandidas, carpetaId]
      guardarExpandidas(expandidas)
      return { expandidas }
    })
}))
