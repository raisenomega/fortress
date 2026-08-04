import type { AgentId } from '@domain/agent/agent'
import type { AgentRanking, AgentRunTotals } from '@domain/telemetry/agent-run'
import type { AgentRunRepository } from '@domain/telemetry/agent-run-repository'
import { newId, nowIso } from '@domain/shared/id'
import { toAgentRun, toRunInsert, type AgentRunRow } from './agent-run-row'
import { createRunAggregates } from './agent-run-aggregates'
import * as SQL from './agent-run-sql'
import type { Db } from './database'
import { usageFromRow, type UsageColumns } from './usage-row'

interface TotalsRow extends UsageColumns {
  runs: number
  failed: number
  edits: number
  last_at: string | null
}

export function createSqliteAgentRunRepository(db: Db): AgentRunRepository {
  const insert = db.prepare(SQL.INSERT_RUN)
  const selectOne = db.prepare(SQL.SELECT_ONE)
  const byProject = db.prepare(SQL.SELECT_BY_PROJECT)
  const byAgent = db.prepare(SQL.SELECT_BY_AGENT)
  const totals = db.prepare(SQL.TOTALS_FOR_AGENT)
  const lastProject = db.prepare(SQL.LAST_PROJECT_FOR_AGENT)
  const ranking = db.prepare(SQL.RANKING_SINCE)

  return {
    record: (run) => {
      const id = newId()
      insert.run(toRunInsert(id, run, nowIso()))
      return toAgentRun(selectOne.get(id) as AgentRunRow)
    },

    listByProject: (projectId, limit) =>
      (byProject.all(projectId, limit) as AgentRunRow[]).map(toAgentRun),

    listByAgent: (agentId, limit) =>
      (byAgent.all(agentId, limit) as AgentRunRow[]).map(toAgentRun),

    totalsFor: (agentId: AgentId, projectId): AgentRunTotals => {
      const scope = { agentId, projectId }
      const row = totals.get(scope) as TotalsRow
      const last = lastProject.get(scope) as { project_id: string } | undefined

      return {
        runs: row.runs,
        failed: row.failed,
        edits: row.edits,
        usage: usageFromRow(row),
        lastAt: row.last_at,
        lastProjectId: last?.project_id ?? null
      }
    },

    ...createRunAggregates(db),

    rankingSince: (since, limit) =>
      (ranking.all(since, limit) as Array<{ agent_id: AgentId; runs: number; edits: number }>).map(
        (row): AgentRanking => ({ agentId: row.agent_id, runs: row.runs, edits: row.edits })
      )
  }
}
