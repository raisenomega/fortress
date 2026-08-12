import { create } from 'zustand'

export interface Toast {
  readonly id: string
  readonly message: string
  /** Veces que se ha emitido este mismo mensaje. Se agrupan en vez de apilarse. */
  readonly count: number
}

interface ToastState {
  readonly toasts: readonly Toast[]
  push: (message: string) => void
  dismiss: (id: string) => void
}

let seq = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  // Un fallo que se repite (reintentos, un efecto que corre dos veces) apilaba
  // un aviso identico por cada emision. Se agrupan por mensaje y se cuentan.
  push: (message) =>
    set((s) => {
      const previo = s.toasts.find((t) => t.message === message)
      if (previo) {
        return {
          toasts: s.toasts.map((t) => (t.id === previo.id ? { ...t, count: t.count + 1 } : t))
        }
      }
      return { toasts: [...s.toasts, { id: `t${(seq += 1)}`, message, count: 1 }] }
    }),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}))

/**
 * Reporta un fallo de fondo que no tiene su propio panel: cargas silenciosas y
 * botones "fire and forget" cuyo canal IPC puede rechazar sin que se vea nada.
 */
export function reportError(message: string): void {
  useToastStore.getState().push(message)
}
