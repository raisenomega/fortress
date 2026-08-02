import type { AppContext } from '@application/context'
import { createAnthropicKeyValidator } from '../ai/anthropic-key-validator'
import { createSafeStorageApiKeyStore } from '../security/api-key-store'
import { getDatabase } from './database'
import { createSqliteChatRepository } from './sqlite-chat-repository'
import { createSqliteFindingRepository } from './sqlite-finding-repository'
import { createSqliteProjectRepository } from './sqlite-project-repository'
import { createSqliteSettingsRepository } from './sqlite-settings-repository'

let context: AppContext | null = null

/** Ensambla los adaptadores concretos detras de los puertos del dominio. */
export function getAppContext(): AppContext {
  if (context) return context

  const db = getDatabase()
  const settings = createSqliteSettingsRepository(db)

  context = {
    projects: createSqliteProjectRepository(db),
    findings: createSqliteFindingRepository(db),
    chat: createSqliteChatRepository(db),
    transaction: (work) => db.transaction(work)(),
    settings,
    apiKeys: createSafeStorageApiKeyStore(settings),
    apiKeyValidator: createAnthropicKeyValidator()
  }
  return context
}
