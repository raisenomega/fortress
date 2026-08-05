import type { NewCapability } from '@domain/system/capability'
import type { CapabilityNote, NewCapabilityNote } from '@domain/system/capability-note'
import type { AgentDraft } from '@domain/system/agent-draft'
import type { StoredAgentDraft } from '@domain/system/agent-draft-repository'
import type { Result } from '@domain/shared/result'
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

/** Borrador de la definicion de un agente auto-propuesto. */
export async function loadAgentDraft(id: string): Promise<StoredAgentDraft | null> {
  return api().system.agentDraft(id)
}

export async function saveAgentDraft(
  id: string,
  draft: AgentDraft
): Promise<Result<StoredAgentDraft>> {
  return api().system.setAgentDraft(id, draft)
}

/** Activa/desactiva la inyeccion del agente y refresca las capacidades. */
export async function activateAgent(id: string, human: boolean): Promise<Result<StoredAgentDraft>> {
  const result = await api().system.activateAgent(id, human)
  await loadCapabilities()
  return result
}

export async function deactivateAgent(id: string): Promise<Result<void>> {
  const result = await api().system.deactivateAgent(id)
  await loadCapabilities()
  return result
}
