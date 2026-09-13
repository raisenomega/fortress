import { create } from 'zustand'

interface VerificacionMasivaState {
  /** De quien es el barrido en marcha, o null si no corre ninguno. Un solo
   *  carril en el main: no puede haber dos a la vez ni en dos proyectos. */
  readonly projectId: string | null
  /** Cuantos mitigados ha atendido ya. Sale de contar los golpecitos del motor,
   *  que llegan uno por verificacion: el main no manda progreso propio. */
  readonly hechos: number
  /** La lista fija del arranque. La N de «X de N». */
  readonly total: number
  arrancar: (projectId: string, total: number) => void
  avanzar: () => void
  terminar: () => void
}

export const useVerificacionMasivaStore = create<VerificacionMasivaState>((set) => ({
  projectId: null,
  hechos: 0,
  total: 0,
  arrancar: (projectId, total) => set({ projectId, hechos: 0, total }),
  avanzar: () => set((s) => ({ hechos: s.hechos + 1 })),
  terminar: () => set({ projectId: null })
}))
