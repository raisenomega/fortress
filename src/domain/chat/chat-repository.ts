import type { ChatMessage, NewChatMessage } from './chat-message'

/** Puerto de persistencia del chat. El historial esta siempre acotado a un proyecto. */
export interface ChatRepository {
  listByProject(projectId: string): readonly ChatMessage[]
  add(message: NewChatMessage): ChatMessage
  clearProject(projectId: string): void
}
