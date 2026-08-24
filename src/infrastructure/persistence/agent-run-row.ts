import type { AgentId } from '@domain/agent/agent'
import type { AgentRun, NewAgentRun, RunKind } from '@domain/telemetry/agent-run'
import { countEdits } from '@domain/telemetry/edit-tools'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
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
  readonly usage_known: number | null
}

/** El CHECK de la tabla ya los acota; esto protege de una base tocada a mano. */
const isRunKind = (value: string): value is RunKind =>
  value === 'chat' || value === 'scan' || value === 'repair'

/** Las herramientas se guardan separadas por coma: son nombres, no texto libre. */
const SEPARATOR = ','

export function toAgentRun(row: AgentRunRow): AgentRun {
  return {
    id: row.id,
    projectId: row.project_id,
    agentId: (row.agent_id as AgentId | null) ?? null,
    kind: isRunKind(row.kind) ? row.kind : 'chat',
    durationMs: row.duration_ms,
    failed: row.failed === 1,
    usage: usageFromRow(row),
    tools: row.tools === '' ? [] : row.tools.split(SEPARATOR),
    at: row.at,
    usageKnown: row.usage_known === null ? null : row.usage_known === 1
  }
}

/**
 * Sin factura los contadores van a cero igual —la columna es NOT NULL— pero
 * `usage_known = 0` los convierte en "no se" en vez de "gratis". La duracion NO
 * se toca: esa si esta medida, y es el unico dato cuantitativo que queda de una
 * corrida que murio antes de facturar.
 */
export function toRunInsert(id: string, run: NewAgentRun, at: string): Record<string, unknown> {
  const usage = run.usage ?? EMPTY_USAGE
  return {
    id,
    projectId: run.projectId,
    agentId: run.agentId,
    kind: run.kind,
    durationMs: run.durationMs,
    failed: run.failed ? 1 : 0,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    cacheReadTokens: usage.cacheReadTokens,
    cacheCreationTokens: usage.cacheCreationTokens,
    costUsd: usage.costUsd,
    numTurns: usage.numTurns,
    usageKnown: run.usage === undefined ? 0 : 1,
    edits: countEdits(run.tools),
    tools: run.tools.join(SEPARATOR),
    at
  }
}
