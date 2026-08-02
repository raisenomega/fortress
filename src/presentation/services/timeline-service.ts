import { api } from '../adapters/fortress-api'
import { useTimelineStore } from '../stores/timeline-store'

/**
 * Se carga un tope de entradas y se filtra en memoria: filtrar en SQL obligaria
 * a ir al proceso principal en cada cambio de desplegable, y el timeline de un
 * proyecto cabe de sobra en memoria.
 */
export const TIMELINE_LIMIT = 300

export async function loadTimeline(projectId: string): Promise<void> {
  const entries = await api().activity.byProject(projectId, TIMELINE_LIMIT)
  useTimelineStore.getState().setEntries(projectId, entries)
}
