import { create } from 'zustand'
import type { FindingHistoria } from '@domain/project/finding-historia'
import { api } from '../adapters/fortress-api'
import { reportError } from '../stores/toast-store'

interface HistoriaState {
  readonly byProject: Readonly<Record<string, readonly FindingHistoria[]>>
  set: (projectId: string, historia: readonly FindingHistoria[]) => void
}

/** Por proyecto, como el resto: el operador cambia de uno a otro y volver no
 *  deberia costar otra consulta. */
const useHistoriaStore = create<HistoriaState>((set) => ({
  byProject: {},
  set: (projectId, historia) =>
    set((state) => ({ byProject: { ...state.byProject, [projectId]: historia } }))
}))

const VACIA: readonly FindingHistoria[] = []

export function useHistoria(projectId: string | null): readonly FindingHistoria[] {
  return useHistoriaStore((state) => (projectId === null ? VACIA : state.byProject[projectId])) ?? VACIA // prettier-ignore
}

/**
 * Trae lo cerrado del proyecto (ADR-087).
 *
 * Se pide al abrir la pantalla y no al arrancar la app: la historia no la mira
 * nadie hasta que la busca, y cargarla con el resto seria una consulta por
 * proyecto en cada arranque para algo que casi nunca se abre.
 */
export async function cargarHistoria(projectId: string): Promise<void> {
  try {
    useHistoriaStore.getState().set(projectId, await api().scan.historia(projectId))
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'Fallo al leer la historia')
  }
}
