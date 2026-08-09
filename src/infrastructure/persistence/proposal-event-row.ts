import type { Actor, EventPhase, EventType, ProposalEvent } from '@domain/repair/proposal-event'
import type { ProposalState } from '@domain/repair/proposal'

export interface EventRow {
  readonly id: string
  readonly proposal_id: string
  readonly seq: number
  readonly phase: string
  readonly event_type: string
  readonly from_state: string | null
  readonly to_state: string | null
  readonly actor: string
  readonly agent_run_id: string | null
  readonly scan_id: string | null
  readonly reason: string | null
  readonly cost_tokens: number | null
  readonly duration_ms: number | null
  readonly evidence_json: string | null
  readonly ts: number
}

/** NULL de SQL <-> undefined del dominio, sin perder ningun campo. */
export function toEvent(r: EventRow): ProposalEvent {
  return {
    id: r.id,
    proposalId: r.proposal_id,
    seq: r.seq,
    phase: r.phase as EventPhase,
    eventType: r.event_type as EventType,
    ...(r.from_state === null ? {} : { fromState: r.from_state as ProposalState }),
    ...(r.to_state === null ? {} : { toState: r.to_state as ProposalState }),
    actor: r.actor as Actor,
    ...(r.agent_run_id === null ? {} : { agentRunId: r.agent_run_id }),
    ...(r.scan_id === null ? {} : { scanId: r.scan_id }),
    ...(r.reason === null ? {} : { reason: r.reason }),
    ...(r.cost_tokens === null ? {} : { costTokens: r.cost_tokens }),
    ...(r.duration_ms === null ? {} : { durationMs: r.duration_ms }),
    ...(r.evidence_json === null ? {} : { evidenceJson: r.evidence_json }),
    ts: r.ts
  }
}
