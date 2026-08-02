import type { AppContext } from '@application/context'
import { createAnthropicKeyValidator } from '../ai/anthropic-key-validator'
import { createSafeStorageApiKeyStore } from '../security/api-key-store'
import { getDatabase } from './database'
import { createSqliteAgentRunRepository } from './sqlite-agent-run-repository'
import { createSqliteChatRepository } from './sqlite-chat-repository'
import { createSqliteFindingRepository } from './sqlite-finding-repository'
import { createSqliteProjectRepository } from './sqlite-project-repository'
import { createSqliteScanHistoryRepository } from './sqlite-scan-history-repository'
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
    scans: createSqliteScanHistoryRepository(db),
    chat: createSqliteChatRepository(db),
    runs: createSqliteAgentRunRepository(db),
    transaction: (work) => db.transaction(work)(),
    settings,
    apiKeys: createSafeStorageApiKeyStore(settings),
    apiKeyValidator: createAnthropicKeyValidator()
  }
  return context
}
