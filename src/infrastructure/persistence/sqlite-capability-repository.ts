import { newId, nowIso } from '@domain/shared/id'
import type { CapabilityKind, StoredCapability } from '@domain/system/capability'
import type { CapabilityRepository } from '@domain/system/capability-repository'
import type { Db } from './database'

interface Row {
  readonly id: string
  readonly kind: string
  readonly name: string
  readonly origin_observation: string
  readonly created_at: string
}

function toCapability(row: Row): StoredCapability {
  return {
    id: row.id,
    kind: row.kind as CapabilityKind,
    name: row.name,
    originObservation: row.origin_observation,
    createdAt: row.created_at
  }
}

/** Capacidades auto-propuestas. Global, sin cascada de proyecto. Parametrizado. */
export function createSqliteCapabilityRepository(db: Db): CapabilityRepository {
  const insert = db.prepare(
    `INSERT INTO capabilities (id, kind, name, origin_observation, created_at)
     VALUES (?, ?, ?, ?, ?)`
  )
  const byId = db.prepare('SELECT * FROM capabilities WHERE id = ?')
  const all = db.prepare('SELECT * FROM capabilities ORDER BY created_at DESC')

  return {
    add: (c) => {
      const id = newId()
      insert.run(id, c.kind, c.name, c.originObservation, nowIso())
      return toCapability(byId.get(id) as Row)
    },
    listAll: () => (all.all() as Row[]).map(toCapability),
    findById: (id) => {
      const row = byId.get(id) as Row | undefined
      return row ? toCapability(row) : null
    }
  }
}
