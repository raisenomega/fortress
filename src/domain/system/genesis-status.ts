import type { GenesisStopReason } from './genesis-decision'

export type GenesisPhase = 'corriendo' | 'parado'

/** Estado del bucle de genesis para el HUD del renderer. */
export interface GenesisStatus {
  readonly phase: GenesisPhase
  readonly episodesDone: number
  readonly spentSession: number
  readonly costCap: number
  readonly maxEpisodes: number
  /** Por que paro, o null mientras corre. */
  readonly stopReason: GenesisStopReason | null
}
