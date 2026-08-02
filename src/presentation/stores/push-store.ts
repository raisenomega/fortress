import { create } from 'zustand'

export interface PushResult {
  readonly projectId: string
  /** Lo ultimo que dijo git, o el motivo por el que FORTRESS no le dejo llegar. */
  readonly output: string
  readonly failed: boolean
}

interface PushState {
  /** Proyecto cuyo push esta en curso, o null. */
  readonly pushingProjectId: string | null
  readonly lastResult: PushResult | null
  startPush: (projectId: string) => void
  finishPush: (projectId: string, output: string, failed: boolean) => void
}

export const usePushStore = create<PushState>((set) => ({
  pushingProjectId: null,
  lastResult: null,

  startPush: (pushingProjectId) => set({ pushingProjectId, lastResult: null }),

  finishPush: (projectId, output, failed) =>
    set({ pushingProjectId: null, lastResult: { projectId, output, failed } })
}))

/**
 * El resultado va atado a su proyecto. Sin esto, pushear Omega y cambiar a
 * Nucleo dejaba el error de Omega colgado en la pantalla de Nucleo, atribuido
 * al proyecto equivocado.
 */
export function usePushResult(projectId: string | null): PushResult | null {
  return usePushStore((state) =>
    state.lastResult && state.lastResult.projectId === projectId ? state.lastResult : null
  )
}
