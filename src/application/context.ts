import type { ChatRepository } from '@domain/chat/chat-repository'
import type { ProjectRepository } from '@domain/project/project-repository'
import type { SettingsRepository } from '@domain/settings/settings-repository'

/**
 * Puertos que necesitan los casos de uso. La aplicacion solo conoce estas
 * interfaces; quien las implementa (SQLite, Anthropic, filesystem) es cosa
 * de la infraestructura.
 */
export interface AppContext {
  readonly projects: ProjectRepository
  readonly chat: ChatRepository
  readonly settings: SettingsRepository
}
