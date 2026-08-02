import type { AgentId } from '@domain/agent/agent'
import type { AgentRun, NewAgentRun } from '@domain/telemetry/agent-run'
import { countEdits } from '@domain/telemetry/edit-tools'
import { usageFromRow, type UsageColumns } from './usage-row'

export interface AgentRunRow extends UsageColumns {
  readonly id: string
  readonly project_id: string
  readonly agent_id: string | null
  readonly kind: string
  readonly duration_ms: number
  readonly failed: number
  readonly tools: string
  readonly at: string
}

/** Las herramientas se guardan separadas por coma: son nombres, no texto libre. */
const SEPARATOR = ','

export function toAgentRun(row: AgentRunRow): AgentRun {
  return {
    id: row.id,
    projectId: row.project_id,
    agentId: (row.agent_id as AgentId | null) ?? null,
    kind: row.kind === 'scan' ? 'scan' : 'chat',
    durationMs: row.duration_ms,
    failed: row.failed === 1,
    usage: usageFromRow(row),
    tools: row.tools === '' ? [] : row.tools.split(SEPARATOR),
    at: row.at
  }
}

export function toRunInsert(id: string, run: NewAgentRun, at: string): Record<string, unknown> {
  return {
    id,
    projectId: run.projectId,
    agentId: run.agentId,
    kind: run.kind,
    durationMs: run.durationMs,
    failed: run.failed ? 1 : 0,
    inputTokens: run.usage.inputTokens,
    outputTokens: run.usage.outputTokens,
    cacheReadTokens: run.usage.cacheReadTokens,
    cacheCreationTokens: run.usage.cacheCreationTokens,
    costUsd: run.usage.costUsd,
    numTurns: run.usage.numTurns,
    edits: countEdits(run.tools),
    tools: run.tools.join(SEPARATOR),
    at
  }
}
