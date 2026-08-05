import { create } from 'zustand'
import type { GenesisStatus } from '@domain/system/genesis-status'

interface GenesisState {
  readonly status: GenesisStatus | null
  /** Topes fijados: sin ellos el toggle no se puede encender. */
  readonly configured: boolean
  setStatus: (status: GenesisStatus) => void
  setConfigured: (configured: boolean) => void
}

export const useGenesisStore = create<GenesisState>((set) => ({
  status: null,
  configured: false,
  setStatus: (status) => set({ status }),
  setConfigured: (configured) => set({ configured })
}))

export function useGenesisStatus(): GenesisStatus | null {
  return useGenesisStore((state) => state.status)
}

export function useGenesisConfigured(): boolean {
  return useGenesisStore((state) => state.configured)
}
