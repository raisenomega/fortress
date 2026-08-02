import type { ChatRepository } from '@domain/chat/chat-repository'
import type { FindingRepository } from '@domain/project/finding-repository'
import type { ProjectRepository } from '@domain/project/project-repository'
import type { ApiKeyStore, ApiKeyValidator } from '@domain/settings/api-key-store'
import type { SettingsRepository } from '@domain/settings/settings-repository'
import type { RunInTransaction } from '@domain/shared/transaction'

/**
 * Puertos que necesitan los casos de uso. La aplicacion solo conoce estas
 * interfaces; quien las implementa (SQLite, Anthropic, safeStorage) es cosa
 * de la infraestructura.
 */
export interface AppContext {
  readonly projects: ProjectRepository
  readonly findings: FindingRepository
  readonly chat: ChatRepository
  readonly transaction: RunInTransaction
  readonly settings: SettingsRepository
  readonly apiKeys: ApiKeyStore
  readonly apiKeyValidator: ApiKeyValidator
}
