import { create } from 'zustand'
import type { ChatProgress } from '@domain/chat/chat-stream'

interface RunMeterState {
  /** Momento de arranque, para el cronometro. Null cuando no corre nada. */
  readonly startedAt: number | null
  readonly step: number
  readonly total: number
  readonly tokens: number
  readonly costUsd: number
  /** Que esta haciendo el turno ahora (ADR-097), o nada que contar. */
  readonly fase: ChatProgress['fase']
  begin: (startedAt: number) => void
  /** Por OBJETO y no por cuatro posicionales: asi un campo nuevo del canal llega
   *  hasta aqui en vez de caerse en silencio en la llamada. */
  progress: (p: Omit<ChatProgress, 'projectId'>) => void
  end: () => void
}

export const useRunMeterStore = create<RunMeterState>((set) => ({
  startedAt: null,
  step: 0,
  total: 0,
  tokens: 0,
  costUsd: 0,
  fase: undefined,
  begin: (startedAt) => set({ startedAt, step: 0, total: 0, tokens: 0, costUsd: 0, fase: undefined }),
  progress: (p) => set({ step: p.index, total: p.total, tokens: p.tokens, costUsd: p.costUsd, fase: p.fase }),
  end: () => set({ startedAt: null })
}))
