import type { Capability, NewCapability, StoredCapability } from '@domain/system/capability'
import type { CapabilityNote, NewCapabilityNote } from '@domain/system/capability-note'
import type { AgentDraft } from '@domain/system/agent-draft'
import type { StoredAgentDraft } from '@domain/system/agent-draft-repository'
import type { SelfObservation } from '@domain/system/self-observation'
import type { Result } from '@domain/shared/result'

/**
 * Backlog de auto-mejora: lo que los agentes descubren de FORTRESS mismo
 * mientras trabajan en otros proyectos, para que el sistema madure solo.
 */
export interface SelfImprovementApi {
  /** Pendientes abiertos, del mas reciente al mas antiguo. */
  observations(): Promise<readonly SelfObservation[]>
  resolveObservation(id: string): Promise<void>
  /** Registra una capacidad nueva en 'propuesta'. No genera ni ejecuta nada. */
  proposeCapability(input: NewCapability): Promise<Result<StoredCapability>>
  /** Capacidades auto-propuestas con su fase y madurez, derivadas del historial. */
  capabilities(): Promise<readonly Capability[]>
  /** Salta una capacidad de fase si OMEGA no veta y (para un agente) hay humano. */
  promoteCapability(id: string, humanApproved: boolean): Promise<Result<Capability>>
  /** Notas de refuerzo hacia una capacidad (dato seed de los agentes). */
  capabilityNotes(id: string): Promise<readonly CapabilityNote[]>
  addCapabilityNote(input: NewCapabilityNote): Promise<Result<CapabilityNote>>
  /** Borrador de la definicion de un agente auto-propuesto (dato, no codigo). */
  agentDraft(id: string): Promise<StoredAgentDraft | null>
  setAgentDraft(id: string, draft: AgentDraft): Promise<Result<StoredAgentDraft>>
  /** Activa/desactiva la inyeccion del agente en el despacho. */
  activateAgent(id: string, humanApproved: boolean): Promise<Result<StoredAgentDraft>>
  deactivateAgent(id: string): Promise<Result<void>>
}
