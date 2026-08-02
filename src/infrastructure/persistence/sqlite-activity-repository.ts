import type { AgentId } from '@domain/agent/agent'
import { isActivityKind, type Activity, type ActivityRepository } from '@domain/telemetry/activity'
import { newId, nowIso } from '@domain/shared/id'
import { isSeverity } from '@domain/shared/severity'
import type { Db } from './database'

const COLUMNS = 'id, project_id, agent_id, kind, summary, severity, file, line, at'

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
  const insert = db.prepare(
    `INSERT INTO activity (${COLUMNS}) VALUES (@id, @projectId, @agentId, @kind,
     @summary, @severity, @file, @line, @at)`
  )
  const byProject = db.prepare(
    `SELECT ${COLUMNS} FROM activity WHERE project_id = ? ORDER BY at DESC, rowid DESC LIMIT ?`
  )
  const byAgent = db.prepare(
    `SELECT ${COLUMNS} FROM activity
     WHERE agent_id = @agentId AND (@projectId IS NULL OR project_id = @projectId)
     ORDER BY at DESC, rowid DESC LIMIT @limit`
  )

  // Un escaneo genera muchas entradas de golpe: o entran todas o ninguna.
  const insertMany = db.transaction((entries: readonly Activity[]) => {
    entries.forEach((entry) => insert.run(entry))
  })

  return {
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
