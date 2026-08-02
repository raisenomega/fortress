import type { AppContext } from '@application/context'
import { getDatabase } from './database'
import { createSqliteChatRepository } from './sqlite-chat-repository'
import { createSqliteProjectRepository } from './sqlite-project-repository'
import { createSqliteSettingsRepository } from './sqlite-settings-repository'

let context: AppContext | null = null

/** Ensambla los adaptadores SQLite detras de los puertos del dominio. */
export function getAppContext(): AppContext {
  if (context) return context

  const db = getDatabase()
  context = {
    projects: createSqliteProjectRepository(db),
    chat: createSqliteChatRepository(db),
    settings: createSqliteSettingsRepository(db)
  }
  return context
}
