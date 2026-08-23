import { create } from 'zustand'
import type { NoticeTone } from '../components/common/Notice'

export interface Toast {
  readonly id: string
  readonly message: string
  /** Como se pinta. Viaja con el aviso: quien lo emite sabe si es una buena
   *  noticia, y el que lo pinta no puede saberlo mirando el texto. */
  readonly tone: NoticeTone
  /** Veces que se ha emitido este mismo mensaje. Se agrupan en vez de apilarse. */
  readonly count: number
}

interface ToastState {
  readonly toasts: readonly Toast[]
  push: (message: string, tone: NoticeTone) => void
  dismiss: (id: string) => void
}

let seq = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  // Un fallo que se repite (reintentos, un efecto que corre dos veces) apilaba
  // un aviso identico por cada emision. Se agrupan por mensaje y se cuentan.
  push: (message, tone) =>
    set((s) => {
      // Agrupa por mensaje Y tono: el mismo texto con dos tonos son dos avisos.
      const previo = s.toasts.find((t) => t.message === message && t.tone === tone)
      if (previo) {
        return {
          toasts: s.toasts.map((t) => (t.id === previo.id ? { ...t, count: t.count + 1 } : t))
        }
      }
      return { toasts: [...s.toasts, { id: `t${(seq += 1)}`, message, tone, count: 1 }] }
    }),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}))

/**
 * Reporta un fallo de fondo que no tiene su propio panel: cargas silenciosas y
 * botones "fire and forget" cuyo canal IPC puede rechazar sin que se vea nada.
 */
export function reportError(message: string): void {
  useToastStore.getState().push(message, 'error')
}

/**
 * Lo que paso y no fue un fallo. El tono lo elige quien llama porque solo el
 * sabe si su noticia es buena: `ok` para un resultado que salio bien —una
 * integracion, un fix aplicado—, y el neutro por defecto para lo que
 * simplemente hay que contar. Todos compartian el rojo de los errores, asi que
 * integrar un fix se leia como un problema.
 */
export function notify(message: string, tone: NoticeTone = 'aviso'): void {
  useToastStore.getState().push(message, tone)
}
