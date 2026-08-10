import type { AnalystRunMeta } from '@domain/repair/analysis'
import { buildAgentRunEvent, buildTransitionEvent } from '@domain/repair/proposal-event'
import type { ProposalState } from '@domain/repair/proposal'
import type { ProposalEventLog } from './proposal-event-log'
import { next, safeRecord, type BookCursor } from './book-cursor'

export { cursorFrom, type BookCursor } from './book-cursor'

/** DECISION del motor dentro de la fase GENERATE (p. ej. WORKTREE_CREATE). */
export function emitDecision(
  log: ProposalEventLog,
  cursor: BookCursor,
  proposalId: string,
  reason: string,
  evidence: object,
  ts: number
): Promise<void> {
  const base = buildTransitionEvent({ proposalId, seq: next(cursor), phase: 'GENERATE', toState: 'ANALIZADO', reason, evidenceJson: JSON.stringify(evidence), ts }) // prettier-ignore
  return safeRecord(log, { ...base, eventType: 'DECISION' })
}

/** La corrida del generador, con su factura (undefined si no se conoce). */
export function emitGeneratorRun(
  log: ProposalEventLog,
  cursor: BookCursor,
  proposalId: string,
  runMeta: AnalystRunMeta
): Promise<void> {
  return safeRecord(
    log,
    buildAgentRunEvent({
      proposalId, seq: next(cursor), phase: 'GENERATE', actor: 'claude-generator',
      agentRunId: runMeta.agentRunId, costTokens: runMeta.tokensUsed,
      durationMs: runMeta.durationMs, ts: runMeta.endedAt
    }) // prettier-ignore
  )
}

/** La transicion que cierra la fase: GENERADO, RECHAZADO o CADUCADO (supersede). */
export function emitOutcome(
  log: ProposalEventLog,
  cursor: BookCursor,
  proposalId: string,
  toState: ProposalState,
  reason: string,
  evidence: object,
  ts: number
): Promise<void> {
  const phase = toState === 'CADUCADO' ? 'EXPIRE' : 'GENERATE'
  return safeRecord(
    log,
    buildTransitionEvent({ proposalId, seq: next(cursor), phase, fromState: 'ANALIZADO', toState, reason, evidenceJson: JSON.stringify(evidence), ts }) // prettier-ignore
  )
}
