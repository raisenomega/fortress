import { create } from 'zustand'
import type { GraphAb, GraphVerify } from '@domain/graph/graph-actions'

type GraphAction = 'install' | 'verify' | 'ab'

export interface GraphActionState {
  /** Accion en curso, o null. Bloquea los botones mientras corre. */
  readonly running: GraphAction | null
  readonly progress: string
  readonly verify: GraphVerify | null
  readonly ab: GraphAb | null
  readonly installFailed: boolean
  readonly abFailed: boolean
  readonly error: string | null
}

const EMPTY: GraphActionState = {
  running: null,
  progress: '',
  verify: null,
  ab: null,
  installFailed: false,
  abFailed: false,
  error: null
}

interface Store {
  /** Estado POR PROYECTO: al volver al panel se ve la ultima accion de cada uno. */
  readonly byProject: Readonly<Record<string, GraphActionState>>
  start: (projectId: string, action: GraphAction) => void
  append: (projectId: string, delta: string) => void
  done: (projectId: string, patch: Partial<GraphActionState>) => void
}

function merge(
  state: Store,
  id: string,
  changes: Partial<GraphActionState>
): Pick<Store, 'byProject'> {
  const current = state.byProject[id] ?? EMPTY
  return { byProject: { ...state.byProject, [id]: { ...current, ...changes } } }
}

const RESET = { progress: '', error: null, installFailed: false, abFailed: false }

export const useGraphActionStore = create<Store>((set) => ({
  byProject: {},
  start: (id, running) => set((state) => merge(state, id, { running, ...RESET })),
  append: (id, delta) =>
    set((state) => merge(state, id, { progress: (state.byProject[id]?.progress ?? '') + delta })),
  done: (id, patch) => set((state) => merge(state, id, { running: null, ...patch }))
}))

/** Estado de las acciones del grafo de un proyecto (referencia estable por default). */
export function useGraphAction(projectId: string | null): GraphActionState {
  return useGraphActionStore((state) => (projectId ? (state.byProject[projectId] ?? EMPTY) : EMPTY))
}
