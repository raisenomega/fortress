import type { NewCapability } from '@domain/system/capability'
import type { CapabilityNote, NewCapabilityNote } from '@domain/system/capability-note'
import type { ResumenImport } from '@application/system/importar-atendidos'
import type { Result } from '@domain/shared/result'
import { api } from '../adapters/fortress-api'
import { useSelfImprovementStore } from '../stores/self-improvement-store'

/** Relee los pendientes de auto-mejora que los agentes fueron dejando. */
export async function loadObservations(): Promise<void> {
  useSelfImprovementStore.getState().setObservations(await api().system.observations())
}

/** Escribe el backlog a disco para trabajarlo fuera. Devuelve la ruta o el error. */
export async function exportObservations(): Promise<Result<string>> {
  return api().system.exportObservations()
}

/** Asienta lo que se atendio fuera y relee: la lista pierde lo ya cerrado. */
export async function importAttended(): Promise<Result<ResumenImport>> {
  const resumen = await api().system.importAttended()
  if (resumen.ok) await loadObservations()
  return resumen
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

/** Notas de refuerzo hacia una capacidad. */
export async function fetchCapabilityNotes(id: string): Promise<readonly CapabilityNote[]> {
  return api().system.capabilityNotes(id)
}

/** Deja una nota de refuerzo y devuelve la lista actualizada. */
export async function addCapabilityNote(
  input: NewCapabilityNote
): Promise<readonly CapabilityNote[]> {
  await api().system.addCapabilityNote(input)
  return api().system.capabilityNotes(input.capabilityId)
}
