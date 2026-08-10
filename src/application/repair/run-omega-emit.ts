import type { AnalystRunMeta } from '@domain/repair/analysis'
import type { Proposal } from '@domain/repair/proposal'
import type { RejectionReason } from '@domain/repair/repair-rejection'
import { buildAgentRunEvent, buildTransitionEvent } from '@domain/repair/proposal-event'
import type { AppContext } from '../context'
import { next, safeRecord, type BookCursor } from './book-cursor'

/** La corrida de OMEGA con su factura; el verdict entero va en la evidencia. */
export function emitOmegaRun(
  ctx: AppContext,
  cursor: BookCursor,
  proposalId: string,
  runMeta: AnalystRunMeta,
  evidence: object
): Promise<void> {
  const base = buildAgentRunEvent({
    proposalId, seq: next(cursor), phase: 'OMEGA', actor: 'omega',
    costTokens: runMeta.tokensUsed, durationMs: runMeta.durationMs, ts: runMeta.endedAt
  }) // prettier-ignore
  return safeRecord(ctx.eventLog, { ...base, evidenceJson: JSON.stringify(evidence) })
}

/** El agente dijo X, las reglas dicen Y: el motor manda y lo deja asentado. */
export function emitOmegaMismatch(
  ctx: AppContext,
  cursor: BookCursor,
  proposalId: string,
  agentSaid: string,
  rulesSay: string,
  ts: number
): Promise<void> {
  const base = buildTransitionEvent({
    proposalId, seq: next(cursor), phase: 'OMEGA', toState: 'GATE',
    reason: 'omega_verdict_mismatch', evidenceJson: JSON.stringify({ agentSaid, rulesSay }), ts
  }) // prettier-ignore
  return safeRecord(ctx.eventLog, { ...base, eventType: 'DECISION' })
}

/** Cierre del juicio: OMEGA (aprobado) o RECHAZADO. Worktree JAMAS se toca. */
export async function closeOmega(
  ctx: AppContext,
  cursor: BookCursor,
  proposal: Proposal,
  toState: 'OMEGA' | 'RECHAZADO',
  reason: RejectionReason | string,
  detail: string,
  evidence: object,
  ts: number
): Promise<void> {
  ctx.repairProposals.update(proposal.id, {
    state: toState,
    analysisVerdict: proposal.analysisVerdict ?? 'REAL',
    analysisReason: detail,
    updatedAt: ts
  })
  await safeRecord(
    ctx.eventLog,
    buildTransitionEvent({ proposalId: proposal.id, seq: next(cursor), phase: 'OMEGA', fromState: 'GATE', toState, reason: String(reason), evidenceJson: JSON.stringify(evidence), ts }) // prettier-ignore
  )
}
