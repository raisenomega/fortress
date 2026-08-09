import type { ProposalEvent } from './proposal-event'

/** Puerto del libro de vida. Infra lo implementa sobre SQLite. */
export interface ProposalEventRepository {
  /**
   * Asienta un evento. Exige seq MONOTONA: el siguiente es max(seq)+1 de esa
   * propuesta; un seq forzado que no coincida lanza. La cadena no admite
   * huecos ni reescrituras — es un libro, no un buffer.
   */
  append(event: ProposalEvent): void
  /** La cadena completa, en orden de seq. */
  listByProposal(proposalId: string): readonly ProposalEvent[]
  findByAgentRun(agentRunId: string): readonly ProposalEvent[]
}
