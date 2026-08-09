import type { AnalystResult } from '@domain/repair/analysis'
import type { Proposal, ProposalState } from '@domain/repair/proposal'
import {
  buildAgentRunEvent,
  buildTransitionEvent,
  type ProposalEvent
} from '@domain/repair/proposal-event'
import type { ProposalEventLog } from './proposal-event-log'

/**
 * La emision es TELEMETRIA, no gate: se asienta DESPUES de confirmar cada
 * escritura de estado y jamas la revierte. Si el libro falla, se anota en
 * consola (no hay logger central en el main) y la reparacion sigue su curso.
 */
async function safeRecord(log: ProposalEventLog, event: ProposalEvent): Promise<void> {
  try {
    await log.record(event)
  } catch (error) {
    console.error('proposal_events: fallo al asentar un evento', error)
  }
}

/** seq 1 — C1 eligio y la propuesta nacio en ELEGIDO. */
export function recordElegido(
  log: ProposalEventLog,
  proposal: Proposal,
  scanId: string
): Promise<void> {
  return safeRecord(
    log,
    buildTransitionEvent({
      proposalId: proposal.id, seq: 1, phase: 'SELECT', toState: 'ELEGIDO',
      scanId, ts: proposal.createdAt
    }) // prettier-ignore
  )
}

/** seq 2 y 3 — la corrida del analista y la transicion que su veredicto causo. */
export async function recordAnalyzed(
  log: ProposalEventLog,
  proposal: Proposal,
  result: AnalystResult,
  toState: ProposalState
): Promise<void> {
  const { analysis, runMeta } = result
  await safeRecord(
    log,
    buildAgentRunEvent({
      proposalId: proposal.id, seq: 2, phase: 'ANALYZE', actor: 'claude-analyst',
      agentRunId: runMeta.agentRunId, costTokens: runMeta.tokensUsed,
      durationMs: runMeta.durationMs, ts: runMeta.endedAt
    }) // prettier-ignore
  )
  await safeRecord(
    log,
    buildTransitionEvent({
      proposalId: proposal.id, seq: 3, phase: toState === 'ANALIZADO' ? 'ANALYZE' : 'EXPIRE',
      fromState: 'ELEGIDO', toState, reason: analysis.risk,
      evidenceJson: JSON.stringify(analysis), ts: Date.now()
    }) // prettier-ignore
  )
}
