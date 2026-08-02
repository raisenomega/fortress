import type { AgentId } from '@domain/agent/agent'
import { isActivityKind, type Activity, type ActivityRepository } from '@domain/telemetry/activity'
import { newId, nowIso } from '@domain/shared/id'
import { isSeverity, type Severity } from '@domain/shared/severity'
import * as SQL from './activity-sql'
import type { Db } from './database'

interface ActivityRow {
  readonly id: string
  readonly project_id: string
  readonly agent_id: string | null
  readonly kind: string
  readonly summary: string
  readonly severity: string | null
  readonly file: string
  readonly line: number | null
  readonly at: string
}

interface ReportedRow {
  readonly severity: string
  readonly title: string
  readonly file: string
  readonly line: number | null
}

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    projectId: row.project_id,
    agentId: (row.agent_id as AgentId | null) ?? null,
    kind: isActivityKind(row.kind) ? row.kind : 'chat',
    summary: row.summary,
    severity: isSeverity(row.severity) ? row.severity : null,
    file: row.file,
    line: row.line,
    at: row.at
  }
}

export function createSqliteActivityRepository(db: Db): ActivityRepository {
  const insert = db.prepare(SQL.INSERT)
  const byProject = db.prepare(SQL.BY_PROJECT)
  const byAgent = db.prepare(SQL.BY_AGENT)

  // Un escaneo genera muchas entradas de golpe: o entran todas o ninguna.
  const insertMany = db.transaction((entries: readonly Activity[]) => {
    entries.forEach((entry) => insert.run(entry))
  })

  const reported = db.prepare(SQL.REPORTED_FINDINGS)

  return {
    reportedFindings: (agentId, projectId) =>
      (reported.all(agentId, projectId) as ReportedRow[])
        .filter((row) => isSeverity(row.severity))
        .map((row) => ({
          severity: row.severity as Severity,
          title: row.title,
          file: row.file,
          line: row.line
        })),

    recordMany: (entries) => {
      const at = nowIso()
      insertMany(entries.map((entry) => ({ ...entry, id: newId(), at })) as readonly Activity[])
    },

    listByProject: (projectId, limit) =>
      (byProject.all(projectId, limit) as ActivityRow[]).map(toActivity),

    listByAgent: (agentId, projectId, limit) =>
      (byAgent.all({ agentId, projectId, limit }) as ActivityRow[]).map(toActivity)
  }
}
