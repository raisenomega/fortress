import type { NewOmegaEntry, OmegaEntry } from '@domain/omega/omega-entry'
import type { OmegaLog } from '@domain/omega/omega-log'
import { newId, nowIso } from '@domain/shared/id'
import type { Db } from './database'

interface OmegaRow {
  readonly id: string
  readonly at: string
  readonly project_id: string | null
  readonly agent_id: string | null
  readonly kind: string
  readonly verdict: string
  readonly summary: string
  readonly evidence: string
}

const COLUMNS = 'id, at, project_id, agent_id, kind, verdict, summary, evidence'

function toEntry(row: OmegaRow): OmegaEntry {
  return {
    id: row.id,
    at: row.at,
    projectId: row.project_id,
    agentId: row.agent_id,
    kind: row.kind as OmegaEntry['kind'],
    verdict: row.verdict as OmegaEntry['verdict'],
    summary: row.summary,
    evidence: row.evidence
  }
}

/** Solo anexa y lee. No hay borrar ni editar: el registro es eterno por diseno. */
export function createSqliteOmegaLog(db: Db): OmegaLog {
  const insert = db.prepare(
    `INSERT INTO omega_log (${COLUMNS})
     VALUES (@id, @at, @projectId, @agentId, @kind, @verdict, @summary, @evidence)`
  )
  const selectAll = db.prepare(`SELECT ${COLUMNS} FROM omega_log ORDER BY at DESC LIMIT ?`)
  const byProject = db.prepare(
    `SELECT ${COLUMNS} FROM omega_log WHERE project_id = ? ORDER BY at DESC LIMIT ?`
  )

  return {
    append: (entry: NewOmegaEntry): OmegaEntry => {
      const stamped: OmegaEntry = {
        id: newId(),
        at: nowIso(),
        projectId: entry.projectId,
        agentId: entry.agentId,
        kind: entry.kind,
        verdict: entry.verdict,
        summary: entry.summary,
        evidence: entry.evidence ?? ''
      }
      insert.run(stamped)
      return stamped
    },
    list: (limit) => (selectAll.all(limit) as OmegaRow[]).map(toEntry),
    listByProject: (projectId, limit) => (byProject.all(projectId, limit) as OmegaRow[]).map(toEntry)
  }
}
