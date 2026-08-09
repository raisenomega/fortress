import type { ProposalEventLog } from '@application/repair/proposal-event-log'
import type { ProposalEventRepository } from '@domain/repair/proposal-event-repository'

/** El puerto asincrono de aplicacion, envolviendo el repositorio sincrono. */
export function createProposalEventLog(repo: ProposalEventRepository): ProposalEventLog {
  return {
    record: (event) => Promise.resolve(repo.append(event)),
    list: (proposalId) => Promise.resolve(repo.listByProposal(proposalId))
  }
}
