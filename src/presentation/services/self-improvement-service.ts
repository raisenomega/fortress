import { api } from '../adapters/fortress-api'
import { useSelfImprovementStore } from '../stores/self-improvement-store'

/** Relee los pendientes de auto-mejora que los agentes fueron dejando. */
export async function loadObservations(): Promise<void> {
  useSelfImprovementStore.getState().setObservations(await api().system.observations())
}

/** Marca un pendiente como atendido y refresca la lista. */
export async function resolveObservation(id: string): Promise<void> {
  await api().system.resolveObservation(id)
  await loadObservations()
}
