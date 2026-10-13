import { create } from 'zustand'

interface LazoStore {
  /** El lazo CTO<->Terminal esta corriendo (lo encendio un salto en autonomo). */
  readonly activo: boolean
  /** Vueltas completas (Terminal->CTO) dadas en esta sesion del lazo. */
  readonly iteraciones: number
  /** Turnos del CTO sin PASO (estancamiento): el "idle" determinista. */
  readonly sinAvanzar: number
  /** La cola CONGELADA al arrancar (ids, severidad-primero), o null si aun no se
   *  cargo. El candado estable: no se recomputa hasta `activar`/`parar`. */
  readonly cola: readonly string[] | null
  /** Congela la cola del lazo (snapshot al arrancar). Idempotente por diseño:
   *  quien la carga lo hace una vez por encendido. */
  readonly congelarCola: (ids: readonly string[]) => void
  /** Avanza la cabeza (ATERRIZAJE-5): se cayo el primero por EXTINCION real. Es
   *  la UNICA mutacion de la cola congelada ademas de congelar/parar; un re-escaneo
   *  nunca la toca (el candado estable se conserva). */
  readonly popCola: () => void
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
  cola: null,
  congelarCola: (ids) => set({ cola: ids }),
  popCola: () => set((s) => ({ cola: s.cola === null ? null : s.cola.slice(1) })),
  // Arrancar/parar descongelan: la proxima sesion del lazo toma su propio snapshot.
  activar: () =>
    set((s) => (s.activo ? { sinAvanzar: 0 } : { activo: true, iteraciones: 0, sinAvanzar: 0, cola: null })), // prettier-ignore
  vuelta: () => set((s) => ({ iteraciones: s.iteraciones + 1, sinAvanzar: 0 })),
  estancar: () => set((s) => ({ sinAvanzar: s.sinAvanzar + 1 })),
  parar: () => set({ activo: false, iteraciones: 0, sinAvanzar: 0, cola: null })
}))
