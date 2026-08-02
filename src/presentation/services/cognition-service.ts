import { api } from '../adapters/fortress-api'
import { useCognitionStore } from '../stores/cognition-store'

/** Relee COGNITION-LOG.md del proyecto: lo edita Claude Code, no FORTRESS. */
export async function loadCognition(projectId: string): Promise<void> {
  useCognitionStore.getState().setSnapshot(projectId, await api().cognition.read(projectId))
}
