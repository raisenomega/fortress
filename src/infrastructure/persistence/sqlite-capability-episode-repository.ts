import { newId, nowIso } from '@domain/shared/id'
import type { CapabilityEpisode, EpisodeOutcome } from '@domain/system/capability-episode'
import type { CapabilityEpisodeRepository } from '@domain/system/capability-episode-repository'
import type { Db } from './database'

interface Row {
  readonly id: string
  readonly capability_id: string
  readonly outcome: string
  readonly summary: string
  readonly created_at: string
}

function toEpisode(row: Row): CapabilityEpisode {
  return {
    id: row.id,
    capabilityId: row.capability_id,
    outcome: row.outcome as EpisodeOutcome,
    summary: row.summary,
    createdAt: row.created_at
  }
}

/** Episodios (resoluciones) por capacidad. Global, parametrizado. */
export function createSqliteCapabilityEpisodeRepository(db: Db): CapabilityEpisodeRepository {
  const insert = db.prepare(
    `INSERT INTO capability_episodes (id, capability_id, outcome, summary, created_at)
     VALUES (?, ?, ?, ?, ?)`
  )
  const byId = db.prepare('SELECT * FROM capability_episodes WHERE id = ?')
  const forCap = db.prepare(
    'SELECT * FROM capability_episodes WHERE capability_id = ? ORDER BY created_at DESC LIMIT ?'
  )
  const tally = db.prepare(
    `SELECT COUNT(*) AS episodes,
       COALESCE(SUM(CASE WHEN outcome = 'fail' THEN 1 ELSE 0 END), 0) AS failures
     FROM capability_episodes WHERE capability_id = ?`
  )

  return {
    record: (e) => {
      const id = newId()
      insert.run(id, e.capabilityId, e.outcome, e.summary, nowIso())
      return toEpisode(byId.get(id) as Row)
    },
    listFor: (capabilityId, limit) => (forCap.all(capabilityId, limit) as Row[]).map(toEpisode),
    tallyFor: (capabilityId) => tally.get(capabilityId) as { episodes: number; failures: number }
  }
}
