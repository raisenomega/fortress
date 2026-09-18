import type { AgentId } from '@domain/agent/agent'
import type { AgentRun, RunKind } from '@domain/telemetry/agent-run'
import { RECIBO_SEPARATOR, SEPARATOR } from './agent-run-separators'
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
  readonly recibo: string | null
}

/** El CHECK de la tabla ya los acota; esto protege de una base tocada a mano. */
const isRunKind = (value: string): value is RunKind =>
  value === 'chat' || value === 'scan' || value === 'repair'


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
    usageKnown: row.usage_known === null ? null : row.usage_known === 1,
    // `null` se lee como AUSENTE, no como lista vacia: una corrida sin recibo
    // es una de la que no se capturo, no una que no corrio nada.
    recibo: row.recibo === null ? undefined : row.recibo.split(RECIBO_SEPARATOR)
  }
}

/** La mitad de escritura vive en `agent-run-insert`; se reexporta para que los
 *  llamadores no tengan que saber que el fichero se partio. */
export { toRunInsert } from './agent-run-insert'
