import { create } from 'zustand'

/** Hacia donde salta: al Terminal (2b-a) o de vuelta al CTO (2b-b). */
export type RumboDelSalto = 'al-terminal' | 'al-cto'

/** La ventana entre un fin de turno y el salto: tiempo para leer y, si hace
 *  falta, cancelar antes de que el lazo siga solo. Compartida por 2b-a y 2b-b. */
export const ESPERA_DEL_SALTO_MS = 5000

interface SaltoStore {
  /** Hay un salto esperando su ventana antes de irse solo. */
  readonly pendiente: boolean
  /** El rumbo del salto en vuelo; para el aviso. */
  readonly rumbo: RumboDelSalto | null
  /** Arranca la ventana: al cumplirse `ms` dispara `accion`; otra la reemplaza. */
  readonly programar: (rumbo: RumboDelSalto, ms: number, accion: () => void) => void
  /** Corta la ventana en vuelo (Detener, un turno nuevo, o el operador). */
  readonly cancelar: () => void
}

// El handle vive FUERA del estado: es un recurso, no algo que se renderice.
let handle: ReturnType<typeof setTimeout> | null = null

/**
 * El temporizador cancelable del lazo autonomo (Sello 2b), como store para que
 * el aviso de la ventana se pinte y se pueda cancelar. Uno a la vez: el lazo
 * tiene un salto en vuelo como mucho (ida O vuelta, nunca las dos).
 */
export const useSaltoStore = create<SaltoStore>((set) => ({
  pendiente: false,
  rumbo: null,
  programar: (rumbo, ms, accion) => {
    if (handle !== null) clearTimeout(handle)
    set({ pendiente: true, rumbo })
    handle = setTimeout(() => {
      handle = null
      set({ pendiente: false, rumbo: null })
      accion()
    }, ms)
  },
  cancelar: () => {
    if (handle !== null) clearTimeout(handle)
    handle = null
    set({ pendiente: false, rumbo: null })
  }
}))
