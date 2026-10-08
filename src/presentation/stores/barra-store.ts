import { create } from 'zustand'

const CLAVE = 'fortress-barra-del-chat'

/** Conveniencia por-vista (no estado que importe): si localStorage falla —
 *  previews, datos borrados— la barra simplemente abre por defecto. */
export const leerAbierta = (): boolean => {
  try {
    return globalThis.localStorage?.getItem(CLAVE) !== 'cerrada'
  } catch {
    return true
  }
}

export const guardarAbierta = (abierta: boolean): void => {
  try {
    globalThis.localStorage?.setItem(CLAVE, abierta ? 'abierta' : 'cerrada')
  } catch {
    // Sin almacen: la proxima sesion abre por defecto, nada se rompe.
  }
}

/** Store PROPIO de la barra del Chat (PASO 116): ni una pizca de estado
 *  compartido con la barra principal (useSidebarStore queda intacto). */
interface BarraState {
  readonly abierta: boolean
  /** La SELECCION VIVA: el hilo que manda sobre la rehidratacion-por-par. */
  readonly seleccion: string | null
  /** Donde nace el PROXIMO hilo (Fase 3): null = suelto. El perezoso la lee. */
  readonly carpetaActiva: string | null
  /** La pagina de carpeta abierta en el area principal, o null = el chat. */
  readonly vistaDeCarpeta: string | null
  toggle: () => void
  setSeleccion: (seleccion: string | null) => void
  setCarpetaActiva: (carpetaActiva: string | null) => void
  setVistaDeCarpeta: (vistaDeCarpeta: string | null) => void
}

export const useBarraStore = create<BarraState>((set) => ({
  abierta: leerAbierta(),
  seleccion: null,
  carpetaActiva: null,
  vistaDeCarpeta: null,
  toggle: () =>
    set((s) => {
      guardarAbierta(!s.abierta)
      return { abierta: !s.abierta }
    }),
  setSeleccion: (seleccion) => set({ seleccion }),
  setCarpetaActiva: (carpetaActiva) => set({ carpetaActiva }),
  setVistaDeCarpeta: (vistaDeCarpeta) => set({ vistaDeCarpeta })
}))
