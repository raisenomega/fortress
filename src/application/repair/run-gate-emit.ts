import type { CommandOutcome, GateOutcome } from '@domain/repair/gate-result'
import type { Proposal } from '@domain/repair/proposal'
import type { RejectionReason } from '@domain/repair/repair-rejection'
import { buildAgentRunEvent, buildTransitionEvent } from '@domain/repair/proposal-event'
import type { AppContext } from '../context'
import type { ProposalEventLog } from './proposal-event-log'
import { next, safeRecord, type BookCursor } from './book-cursor'

/** Un AGENT_RUN por comando (npm ci incluido). El gate no gasta modelo:
 *  costTokens queda undefined — honesto. La autopsia viaja en evidenceJson. */
export function emitGateCommand(
  log: ProposalEventLog,
  cursor: BookCursor,
  proposalId: string,
  outcome: CommandOutcome,
  ts: number
): Promise<void> {
  const base = buildAgentRunEvent({
    proposalId, seq: next(cursor), phase: 'GATE', actor: 'gate',
    durationMs: outcome.durationMs, reason: outcome.command, ts
  }) // prettier-ignore
  return safeRecord(log, {
    ...base,
    evidenceJson: JSON.stringify({
      command: outcome.command, exitCode: outcome.exitCode,
      stdoutTail: outcome.stdoutTail, stderrTail: outcome.stderrTail, timedOut: outcome.timedOut
    }) // prettier-ignore
  })
}

/** La transicion que cierra el juicio: GATE (pasado) o RECHAZADO. */
export function emitGateOutcome(
  log: ProposalEventLog,
  cursor: BookCursor,
  proposalId: string,
  toState: 'GATE' | 'RECHAZADO',
  reason: string,
  evidence: object,
  ts: number
): Promise<void> {
  return safeRecord(
    log,
    buildTransitionEvent({ proposalId, seq: next(cursor), phase: 'GATE', fromState: 'GENERADO', toState, reason, evidenceJson: JSON.stringify(evidence), ts }) // prettier-ignore
  )
}

/** Rechazo del gate: patch + eslabon. El worktree JAMAS se toca (autopsia). */
export async function rejectGate(
  ctx: AppContext,
  cursor: BookCursor,
  proposal: Proposal,
  reason: RejectionReason,
  detail: string,
  evidence: object,
  ts: number
): Promise<{ ok: false; reason: string }> {
  ctx.repairProposals.update(proposal.id, {
    state: 'RECHAZADO',
    analysisVerdict: proposal.analysisVerdict ?? 'REAL',
    analysisReason: detail,
    updatedAt: ts
  })
  await emitGateOutcome(ctx.eventLog, cursor, proposal.id, 'RECHAZADO', detail, evidence, ts)
  return { ok: false, reason }
}

/** El outcome del runner ya trae la razon tipada; aqui solo se re-exporta. */
export type { GateOutcome }
