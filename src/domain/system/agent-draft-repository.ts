import type { AgentDraft } from './agent-draft'

/** El borrador persistido, con la marca de si esta activo en el despacho. */
export interface StoredAgentDraft extends AgentDraft {
  readonly capabilityId: string
  readonly active: boolean
}

/** Persistencia de las definiciones de agente auto-propuestas. Solo datos. */
export interface AgentDraftRepository {
  /** Crea o reemplaza el borrador de una capacidad. */
  set(capabilityId: string, draft: AgentDraft): StoredAgentDraft
  get(capabilityId: string): StoredAgentDraft | null
  /** Todos los borradores activos (los que el despacho debe inyectar). */
  listActive(): readonly StoredAgentDraft[]
  setActive(capabilityId: string, active: boolean): void
  countActive(): number
}
