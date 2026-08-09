import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { ProposalEventRepository } from '@domain/repair/proposal-event-repository'
import type { Db } from './database'
import { toEvent, type EventRow } from './proposal-event-row'

const COLS = `id, proposal_id, seq, phase, event_type, from_state, to_state, actor,
  agent_run_id, scan_id, reason, cost_tokens, duration_ms, evidence_json, ts`

/** Consultas parametrizadas siempre; el libro no admite huecos ni reescritura. */
export function createSqliteProposalEventRepository(db: Db): ProposalEventRepository {
  const insert = db.prepare(`INSERT INTO proposal_events (${COLS}) VALUES
    (@id, @proposalId, @seq, @phase, @eventType, @fromState, @toState, @actor,
     @agentRunId, @scanId, @reason, @costTokens, @durationMs, @evidenceJson, @ts)`)
  const maxSeq = db.prepare(
    'SELECT COALESCE(MAX(seq), 0) AS top FROM proposal_events WHERE proposal_id = ?'
  )
  const byProposal = db.prepare(
    `SELECT ${COLS} FROM proposal_events WHERE proposal_id = ? ORDER BY seq`
  )
  const byAgentRun = db.prepare(
    `SELECT ${COLS} FROM proposal_events WHERE agent_run_id = ? ORDER BY ts`
  )

  return {
    append: (event: ProposalEvent) => {
      const { top } = maxSeq.get(event.proposalId) as { top: number }
      if (event.seq !== top + 1) {
        throw new Error(`seq ${event.seq} fuera de orden: el libro espera ${top + 1}`)
      }
      insert.run({
        id: event.id,
        proposalId: event.proposalId,
        seq: event.seq,
        phase: event.phase,
        eventType: event.eventType,
        fromState: event.fromState ?? null,
        toState: event.toState ?? null,
        actor: event.actor,
        agentRunId: event.agentRunId ?? null,
        scanId: event.scanId ?? null,
        reason: event.reason ?? null,
        costTokens: event.costTokens ?? null,
        durationMs: event.durationMs ?? null,
        evidenceJson: event.evidenceJson ?? null,
        ts: event.ts
      })
    },
    listByProposal: (proposalId) => (byProposal.all(proposalId) as EventRow[]).map(toEvent),
    findByAgentRun: (agentRunId) => (byAgentRun.all(agentRunId) as EventRow[]).map(toEvent)
  }
}
