import type { SettingsRepository } from '@domain/settings/settings-repository'
import type { Db } from './database'

export function createSqliteSettingsRepository(db: Db): SettingsRepository {
  const select = db.prepare('SELECT value FROM settings WHERE key = ?')
  const upsert = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  )

  return {
    get: (key) => {
      const row = select.get(key) as { value: string } | undefined
      return row?.value ?? null
    },

    set: (key, value) => {
      upsert.run(key, value)
    }
  }
}
