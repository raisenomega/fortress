import { create } from 'zustand'

interface PushState {
  /** Proyecto cuyo push esta en curso, o null. */
  readonly pushingProjectId: string | null
  /** Lo ultimo que dijo git, para bien o para mal. */
  readonly output: string | null
  readonly failed: boolean
  startPush: (projectId: string) => void
  finishPush: (output: string, failed: boolean) => void
  clearOutput: () => void
}

export const usePushStore = create<PushState>((set) => ({
  pushingProjectId: null,
  output: null,
  failed: false,

  startPush: (pushingProjectId) => set({ pushingProjectId, output: null, failed: false }),
  finishPush: (output, failed) => set({ pushingProjectId: null, output, failed }),
  clearOutput: () => set({ output: null, failed: false })
}))
