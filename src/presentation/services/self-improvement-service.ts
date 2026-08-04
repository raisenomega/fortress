import type { NewCapability } from '@domain/system/capability'
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

/** Relee las capacidades con su fase, madurez y veredicto de OMEGA. */
export async function loadCapabilities(): Promise<void> {
  useSelfImprovementStore.getState().setCapabilities(await api().system.capabilities())
}

/** Registra una capacidad en 'propuesta' (humano) y refresca la lista. */
export async function proposeCapability(input: NewCapability): Promise<void> {
  await api().system.proposeCapability(input)
  await loadCapabilities()
}

/** Pide el salto de fase; OMEGA puede vetarlo. Refresca al terminar. */
export async function promoteCapability(id: string, humanApproved: boolean): Promise<void> {
  await api().system.promoteCapability(id, humanApproved)
  await loadCapabilities()
}
