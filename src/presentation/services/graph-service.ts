import { api } from '../adapters/fortress-api'
import { useGraphStore } from '../stores/graph-store'

export async function loadGraph(projectId: string): Promise<void> {
  useGraphStore.getState().setStatus(projectId, await api().graph.status(projectId))
}
