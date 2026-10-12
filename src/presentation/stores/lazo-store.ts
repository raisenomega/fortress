import { create } from 'zustand'

interface LazoStore {
  /** El lazo CTO<->Terminal esta corriendo (lo encendio un salto en autonomo). */
  readonly activo: boolean
  /** Vueltas completas (Terminal->CTO) dadas en esta sesion del lazo. */
  readonly iteraciones: number
  /** Enciende el lazo; si ya estaba encendido NO reinicia el contador. */
  readonly activar: () => void
  /** Cierra una vuelta (Terminal->CTO): +1 iteracion. */
  readonly vuelta: () => void
  /** Apaga el lazo y pone el contador a cero (Detener o una parada). */
  readonly parar: () => void
}

/**
 * El contador y el on/off del lazo autonomo (Sello 2b), molde del engine de
 * genesis pero en el renderer: el salto CTO->Terminal (2b-a) lo enciende, la
 * vuelta Terminal->CTO (2b-b) suma, y `lazoStop`/Detener lo apagan. Es estado de
 * UI; la decision de PARAR vive en el dominio (`lazo-decision`), no aqui.
 */
export const useLazoStore = create<LazoStore>((set) => ({
  activo: false,
  iteraciones: 0,
  activar: () => set((s) => (s.activo ? s : { activo: true, iteraciones: 0 })),
  vuelta: () => set((s) => ({ iteraciones: s.iteraciones + 1 })),
  parar: () => set({ activo: false, iteraciones: 0 })
}))
