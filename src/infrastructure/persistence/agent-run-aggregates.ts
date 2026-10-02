import type { AgentRunRepository } from '@domain/telemetry/agent-run-repository'
import type { TokenUsage } from '@domain/telemetry/token-usage'
import * as SQL from './agent-run-sql'
import type { Db } from './database'
import { usageFromRow, type UsageColumns } from './usage-row'

type Aggregates = Pick<
  AgentRunRepository,
  | 'usageSince'
  | 'usageByProjectSince'
  | 'averageRun'
  | 'episodeTallySince'
  | 'sinFacturaSince'
  | 'costUsdOf'
>

interface AverageRow {
  readonly runs: number
  readonly avg_cost: number
  readonly avg_ms: number
}

/** Consultas agregadas de agent_runs, separadas del repositorio por tamano. */
export function createRunAggregates(db: Db): Aggregates {
  const usageSince = db.prepare(SQL.USAGE_SINCE)
  const usageByProject = db.prepare(SQL.USAGE_BY_PROJECT_SINCE)
  const average = db.prepare(SQL.AVERAGE_RUN)
  const tally = db.prepare(SQL.EPISODE_TALLY_SINCE)
  const sinFactura = db.prepare(SQL.SIN_FACTURA_SINCE)

  return {
    // Placeholders por cada id, jamas valores interpolados: la lista la pone el
    // motor, pero la regla de la casa no admite excepciones por confianza.
    costUsdOf: (ids) => {
      if (ids.length === 0) return 0
      const huecos = ids.map(() => '?').join(', ')
      const fila = db
        .prepare(`SELECT COALESCE(SUM(cost_usd), 0) AS usd FROM agent_runs WHERE id IN (${huecos})`)
        .get(...ids) as { usd: number }
      return fila.usd
    },

    usageSince: (since) => usageFromRow(usageSince.get(since) as UsageColumns),

    episodeTallySince: (since) => tally.get(since) as { episodes: number; failures: number },

    sinFacturaSince: (since) => {
      const row = sinFactura.get(since) as { runs: number; duration_ms: number }
      return { runs: row.runs, durationMs: row.duration_ms }
    },

    usageByProjectSince: (since) => {
      const rows = usageByProject.all(since) as Array<UsageColumns & { project_id: string }>
      const byId: Record<string, TokenUsage> = {}
      for (const row of rows) byId[row.project_id] = usageFromRow(row)
      return byId
    },

    /** Null sin historial: mejor decir "sin medir" que estimar con un invento. */
    averageRun: (projectId) => {
      const row = average.get(projectId) as AverageRow
      if (row.runs === 0) return null
      return { seconds: Math.round(row.avg_ms / 1000), usd: row.avg_cost }
    }
  }
}
