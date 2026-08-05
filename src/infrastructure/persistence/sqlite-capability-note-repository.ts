import { newId, nowIso } from '@domain/shared/id'
import type { CapabilityNote } from '@domain/system/capability-note'
import type { CapabilityNoteRepository } from '@domain/system/capability-note-repository'
import type { Db } from './database'

interface Row {
  readonly id: string
  readonly capability_id: string
  readonly author: string
  readonly note: string
  readonly created_at: string
}

function toNote(row: Row): CapabilityNote {
  return {
    id: row.id,
    capabilityId: row.capability_id,
    author: row.author,
    note: row.note,
    createdAt: row.created_at
  }
}

/** Notas de refuerzo hacia una capacidad. Global, parametrizado. */
export function createSqliteCapabilityNoteRepository(db: Db): CapabilityNoteRepository {
  const insert = db.prepare(
    `INSERT INTO capability_notes (id, capability_id, author, note, created_at)
     VALUES (?, ?, ?, ?, ?)`
  )
  const byId = db.prepare('SELECT * FROM capability_notes WHERE id = ?')
  const forCap = db.prepare(
    'SELECT * FROM capability_notes WHERE capability_id = ? ORDER BY created_at DESC'
  )

  return {
    add: (n) => {
      const id = newId()
      insert.run(id, n.capabilityId, n.author, n.note, nowIso())
      return toNote(byId.get(id) as Row)
    },
    listFor: (capabilityId) => (forCap.all(capabilityId) as Row[]).map(toNote)
  }
}
