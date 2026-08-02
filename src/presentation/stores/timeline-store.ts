import { create } from 'zustand'
import type { Activity } from '@domain/telemetry/activity'
import { NO_FILTER, type ActivityFilter } from '@domain/telemetry/filter-activity'

interface TimelineState {
  readonly byProject: Readonly<Record<string, readonly Activity[]>>
  readonly filter: ActivityFilter
  setEntries: (projectId: string, entries: readonly Activity[]) => void
  setFilter: (filter: ActivityFilter) => void
}

export const useTimelineStore = create<TimelineState>((set) => ({
  byProject: {},
  filter: NO_FILTER,
  setEntries: (projectId, entries) =>
    set((state) => ({ byProject: { ...state.byProject, [projectId]: entries } })),
  setFilter: (filter) => set({ filter })
}))

/** Referencia estable para lo vacio: un array nuevo por render tumba React. */
const NADA: readonly Activity[] = []

export function useTimeline(projectId: string | null): readonly Activity[] {
  return useTimelineStore((state) => (projectId ? (state.byProject[projectId] ?? NADA) : NADA))
}
