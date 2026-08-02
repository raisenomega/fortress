import type { ChatMessage, NewChatMessage } from '@domain/chat/chat-message'
import type { NewProject, Project } from '@domain/project/project'
import type { Result } from '@domain/shared/result'

/**
 * Contrato del puente main <-> renderer. Solo tipos: este modulo no aporta
 * codigo en runtime, por eso el renderer puede importarlo sin arrastrar
 * nada del proceso principal.
 */
export interface FortressApi {
  readonly projects: {
    list(): Promise<readonly Project[]>
    add(input: NewProject): Promise<Result<Project>>
    remove(id: string): Promise<Result<null>>
  }
  readonly chat: {
    history(projectId: string): Promise<readonly ChatMessage[]>
    append(message: NewChatMessage): Promise<Result<ChatMessage>>
    clear(projectId: string): Promise<void>
  }
  readonly settings: {
    get(key: string): Promise<string | null>
    set(key: string, value: string): Promise<void>
  }
}
