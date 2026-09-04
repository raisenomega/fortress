import type { Capability, NewCapability, StoredCapability } from '@domain/system/capability'
import type { CapabilityNote, NewCapabilityNote } from '@domain/system/capability-note'
import type { AgentDraft } from '@domain/system/agent-draft'
import type { StoredAgentDraft } from '@domain/system/agent-draft-repository'
import type { CapabilityEpisode } from '@domain/system/capability-episode'
import type { GenesisStatus } from '@domain/system/genesis-status'
import type { SelfObservation } from '@domain/system/self-observation'
import type { ResumenImport } from '@application/system/importar-atendidos'
import type { Result } from '@domain/shared/result'
import type { Unsubscribe } from './api-types'

/**
 * Backlog de auto-mejora: lo que los agentes descubren de FORTRESS mismo
 * mientras trabajan en otros proyectos, para que el sistema madure solo.
 */
export interface SelfImprovementApi {
  /** Todas, del mas reciente al mas antiguo. Cerradas incluidas: sin ellas el
   *  panel no podia enseñar que se hubiera atendido nada. */
  observations(): Promise<readonly SelfObservation[]>
  /** Escribe el backlog a un JSON trabajable desde fuera. Devuelve su ruta. */
  exportObservations(): Promise<Result<string>>
  /** Asienta el registro de lo atendido fuera. Devuelve el resumen con sus rechazos. */
  importAttended(): Promise<Result<ResumenImport>>
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
  /** Un agente redacta el borrador solo (corrida real, acotada). Sigue inerte. */
  draftAgentAuto(id: string): Promise<Result<StoredAgentDraft>>
  /** La capacidad resuelve UN escenario y lo registra como episodio propio. */
  runEpisode(id: string): Promise<Result<CapabilityEpisode>>
  /** Enciende/apaga el bucle de genesis (encender exige topes guardados). */
  genesisToggle(on: boolean): Promise<Result<null>>
  /** Suscribe al estado del bucle de genesis, empujado desde el main. */
  onGenesisStatus(listener: (status: GenesisStatus) => void): Unsubscribe
}
