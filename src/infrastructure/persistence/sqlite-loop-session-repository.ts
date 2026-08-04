import type { LoopSession } from '@domain/loop/loop-session'
import type { LoopSessionRepository } from '@domain/loop/loop-session-repository'
import { nowIso } from '@domain/shared/id'
import type { Db } from './database'

interface SessionRow {
  readonly project_id: string
  readonly active: number
  readonly cycles_done: number
  readonly recent_scores: string
  readonly spent_baseline: number
  readonly updated_at: string
}

function toSession(row: SessionRow): LoopSession {
  return {
    projectId: row.project_id,
    active: row.active === 1,
    cyclesDone: row.cycles_done,
    recentScores: JSON.parse(row.recent_scores) as number[],
    spentBaseline: row.spent_baseline,
    updatedAt: row.updated_at
  }
}

/** Persiste el estado del loop para reanudarlo tras un reinicio. Parametrizado. */
export function createSqliteLoopSessionRepository(db: Db): LoopSessionRepository {
  const selectOne = db.prepare('SELECT * FROM loop_sessions WHERE project_id = ?')
  const selectActive = db.prepare('SELECT * FROM loop_sessions WHERE active = 1')
  const upsert = db.prepare(
    `INSERT INTO loop_sessions
       (project_id, active, cycles_done, recent_scores, spent_baseline, updated_at)
     VALUES (@projectId, @active, @cyclesDone, @recentScores, @spentBaseline, @updatedAt)
     ON CONFLICT(project_id) DO UPDATE SET
       active = excluded.active, cycles_done = excluded.cycles_done,
       recent_scores = excluded.recent_scores, spent_baseline = excluded.spent_baseline,
       updated_at = excluded.updated_at`
  )

  return {
    get: (projectId) => {
      const row = selectOne.get(projectId) as SessionRow | undefined
      return row ? toSession(row) : null
    },
    activeSessions: () => (selectActive.all() as SessionRow[]).map(toSession),
    save: (session) =>
      upsert.run({
        projectId: session.projectId,
        active: session.active ? 1 : 0,
        cyclesDone: session.cyclesDone,
        recentScores: JSON.stringify(session.recentScores),
        spentBaseline: session.spentBaseline,
        updatedAt: nowIso()
      })
  }
}
