import { create } from 'zustand'

interface SaltoStore {
  /** Hay un salto CTO->Terminal esperando su ventana antes de irse solo. */
  readonly pendiente: boolean
  /** El texto del PASO que saltara; para mostrarlo en el aviso. */
  readonly paso: string | null
  /** Arranca la ventana: al cumplirse `ms` dispara `accion`; otra la reemplaza. */
  readonly programar: (paso: string, ms: number, accion: () => void) => void
  /** Corta la ventana en vuelo (Detener, un turno nuevo, o el operador). */
  readonly cancelar: () => void
}

// El handle vive FUERA del estado: es un recurso, no algo que se renderice.
let handle: ReturnType<typeof setTimeout> | null = null

/**
 * El temporizador cancelable del lazo autonomo (Sello 2b-a), como store para que
 * el aviso de la ventana se pinte y se pueda cancelar. Uno a la vez: el lazo
 * tiene un salto en vuelo como mucho. Lo reusa el reporte Terminal->CTO (2b-b).
 */
export const useSaltoStore = create<SaltoStore>((set) => ({
  pendiente: false,
  paso: null,
  programar: (paso, ms, accion) => {
    if (handle !== null) clearTimeout(handle)
    set({ pendiente: true, paso })
    handle = setTimeout(() => {
      handle = null
      set({ pendiente: false, paso: null })
      accion()
    }, ms)
  },
  cancelar: () => {
    if (handle !== null) clearTimeout(handle)
    handle = null
    set({ pendiente: false, paso: null })
  }
}))
