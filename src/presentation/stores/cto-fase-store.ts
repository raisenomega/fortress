import { create } from 'zustand'
import type { FaseDelTurno } from '@domain/chat/fase-del-turno'

/**
 * Las fases del turno del CTO ya alcanzadas (PASO 158): alimentan los chips de
 * progreso (contexto·bloque) de la esquina derecha. Llegan por el carril
 * 'chat-cto' (onProgress), NUNCA del medidor del Terminal. Vive aparte del
 * `construir-store` —techo de lineas y estado propio del CTO—, lo que ademas
 * refuerza el aislamiento de vista.
 */
interface CtoFaseState {
  readonly fasesCto: readonly FaseDelTurno[]
  /** Marca una fase como alcanzada (idempotente). */
  marcarFase: (fase: FaseDelTurno) => void
  /** Ambos chips a gris al arrancar un turno del CTO. */
  reiniciarFases: () => void
}

export const useCtoFaseStore = create<CtoFaseState>((set) => ({
  fasesCto: [],
  marcarFase: (fase) =>
    set((s) => (s.fasesCto.includes(fase) ? {} : { fasesCto: [...s.fasesCto, fase] })),
  reiniciarFases: () => set({ fasesCto: [] })
}))
