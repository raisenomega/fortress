import type { ChatRepository } from '@domain/chat/chat-repository'
import type { ProjectRepository } from '@domain/project/project-repository'
import type { ApiKeyStore, ApiKeyValidator } from '@domain/settings/api-key-store'
import type { SettingsRepository } from '@domain/settings/settings-repository'

/**
 * Puertos que necesitan los casos de uso. La aplicacion solo conoce estas
 * interfaces; quien las implementa (SQLite, Anthropic, safeStorage) es cosa
 * de la infraestructura.
 */
export interface AppContext {
  readonly projects: ProjectRepository
  readonly chat: ChatRepository
  readonly settings: SettingsRepository
  readonly apiKeys: ApiKeyStore
  readonly apiKeyValidator: ApiKeyValidator
}
