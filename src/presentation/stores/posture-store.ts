import { create } from 'zustand'
import type { ScanDepth } from '@domain/posture/scan-depth'
import type { PostureResult } from '@domain/posture/posture-scan'

interface PostureState {
  readonly url: string
  readonly depth: ScanDepth
  readonly owned: boolean
  readonly running: boolean
  readonly error: string | null
  readonly result: PostureResult | null
  setUrl: (url: string) => void
  setDepth: (depth: ScanDepth) => void
  setOwned: (owned: boolean) => void
  start: () => void
  finish: (result: PostureResult | null, error: string | null) => void
}

export const usePostureStore = create<PostureState>((set) => ({
  url: '',
  depth: 'ultra',
  owned: false,
  running: false,
  error: null,
  result: null,
  setUrl: (url) => set({ url }),
  setDepth: (depth) => set({ depth }),
  setOwned: (owned) => set({ owned }),
  start: () => set({ running: true, error: null, result: null }),
  finish: (result, error) => set({ running: false, result, error })
}))
