import { create } from 'zustand'

interface LazoStore {
  /** El lazo CTO<->Terminal esta corriendo (lo encendio un salto en autonomo). */
  readonly activo: boolean
  /** Vueltas completas (Terminal->CTO) dadas en esta sesion del lazo. */
  readonly iteraciones: number
  /** Turnos del CTO sin PASO (estancamiento): el "idle" determinista. */
  readonly sinAvanzar: number
  /** Enciende el lazo; si ya estaba encendido solo marca AVANCE (sinAvanzar=0). */
  readonly activar: () => void
  /** Cierra una vuelta (Terminal->CTO): +1 iteracion y AVANCE (sinAvanzar=0). */
  readonly vuelta: () => void
  /** Un empujon sin PASO: +1 sinAvanzar (acerca al estancamiento). */
  readonly estancar: () => void
  /** Apaga el lazo y pone los contadores a cero (Detener o una parada). */
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
  sinAvanzar: 0,
  activar: () =>
    set((s) => (s.activo ? { sinAvanzar: 0 } : { activo: true, iteraciones: 0, sinAvanzar: 0 })),
  vuelta: () => set((s) => ({ iteraciones: s.iteraciones + 1, sinAvanzar: 0 })),
  estancar: () => set((s) => ({ sinAvanzar: s.sinAvanzar + 1 })),
  parar: () => set({ activo: false, iteraciones: 0, sinAvanzar: 0 })
}))
