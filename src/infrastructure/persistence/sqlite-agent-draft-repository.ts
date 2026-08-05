import { nowIso } from '@domain/shared/id'
import type { IconName } from '@domain/shared/icon-name'
import type { AgentDraftRepository, StoredAgentDraft } from '@domain/system/agent-draft-repository'
import type { Db } from './database'

interface Row {
  readonly capability_id: string
  readonly name: string
  readonly prompt: string
  readonly icon_name: string
  readonly active: number
}

function toDraft(row: Row): StoredAgentDraft {
  return {
    capabilityId: row.capability_id,
    name: row.name,
    prompt: row.prompt,
    iconName: row.icon_name as IconName,
    active: row.active === 1
  }
}

/** Definiciones de agente auto-propuestas. Global, parametrizado. */
export function createSqliteAgentDraftRepository(db: Db): AgentDraftRepository {
  const upsert = db.prepare(
    `INSERT INTO agent_definitions (capability_id, name, prompt, icon_name, active, created_at)
     VALUES (@id, @name, @prompt, @icon, 0, @at)
     ON CONFLICT(capability_id) DO UPDATE SET name = @name, prompt = @prompt, icon_name = @icon`
  )
  const byId = db.prepare('SELECT * FROM agent_definitions WHERE capability_id = ?')
  const actives = db.prepare('SELECT * FROM agent_definitions WHERE active = 1')
  const setAct = db.prepare('UPDATE agent_definitions SET active = ? WHERE capability_id = ?')
  const count = db.prepare('SELECT COUNT(*) AS n FROM agent_definitions WHERE active = 1')

  return {
    set: (id, draft) => {
      upsert.run({ id, name: draft.name, prompt: draft.prompt, icon: draft.iconName, at: nowIso() })
      return toDraft(byId.get(id) as Row)
    },
    get: (id) => {
      const row = byId.get(id) as Row | undefined
      return row ? toDraft(row) : null
    },
    listActive: () => (actives.all() as Row[]).map(toDraft),
    setActive: (id, active) => {
      setAct.run(active ? 1 : 0, id)
    },
    countActive: () => (count.get() as { n: number }).n
  }
}
