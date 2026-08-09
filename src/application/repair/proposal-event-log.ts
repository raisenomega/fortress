import type { ProposalEvent } from '@domain/repair/proposal-event'

/**
 * Puerto del libro de vida para los casos de uso. Asincrono a proposito: la
 * emision es telemetria y no debe acoplarse al detalle sincrono del SQL.
 */
export interface ProposalEventLog {
  record(event: ProposalEvent): Promise<void>
  list(proposalId: string): Promise<readonly ProposalEvent[]>
}
