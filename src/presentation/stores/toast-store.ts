import { create } from 'zustand'

export interface Toast {
  readonly id: string
  readonly message: string
}

interface ToastState {
  readonly toasts: readonly Toast[]
  push: (message: string) => void
  dismiss: (id: string) => void
}

let seq = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message) => set((s) => ({ toasts: [...s.toasts, { id: `t${(seq += 1)}`, message }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}))

/**
 * Reporta un fallo de fondo que no tiene su propio panel: cargas silenciosas y
 * botones "fire and forget" cuyo canal IPC puede rechazar sin que se vea nada.
 */
export function reportError(message: string): void {
  useToastStore.getState().push(message)
}
