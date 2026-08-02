import { create } from 'zustand'
import type { ChatMessage } from '@domain/chat/chat-message'

interface ChatState {
  /** Historial por proyecto: cada proyecto tiene su propia conversacion. */
  readonly byProject: Readonly<Record<string, readonly ChatMessage[]>>
  readonly streaming: boolean
  setMessages: (projectId: string, messages: readonly ChatMessage[]) => void
  appendMessage: (message: ChatMessage) => void
  replaceMessage: (id: string, message: ChatMessage) => void
  setStreaming: (streaming: boolean) => void
}

function upsert(
  list: readonly ChatMessage[],
  id: string,
  message: ChatMessage
): readonly ChatMessage[] {
  const index = list.findIndex((current) => current.id === id)
  if (index === -1) return [...list, message]
  return [...list.slice(0, index), message, ...list.slice(index + 1)]
}

export const useChatStore = create<ChatState>((set) => ({
  byProject: {},
  streaming: false,

  setMessages: (projectId, messages) =>
    set((state) => ({ byProject: { ...state.byProject, [projectId]: messages } })),

  appendMessage: (message) =>
    set((state) => ({
      byProject: {
        ...state.byProject,
        [message.projectId]: [...(state.byProject[message.projectId] ?? []), message]
      }
    })),

  replaceMessage: (id, message) =>
    set((state) => ({
      byProject: {
        ...state.byProject,
        [message.projectId]: upsert(state.byProject[message.projectId] ?? [], id, message)
      }
    })),

  setStreaming: (streaming) => set({ streaming })
}))

/**
 * Referencia estable para proyectos sin mensajes. Devolver un `[]` nuevo en
 * cada render haria que zustand viera un snapshot distinto siempre y React
 * entraria en un bucle de actualizacion infinito.
 */
const NO_MESSAGES: readonly ChatMessage[] = []

export function useProjectMessages(projectId: string | null): readonly ChatMessage[] {
  return useChatStore((state) =>
    projectId ? (state.byProject[projectId] ?? NO_MESSAGES) : NO_MESSAGES
  )
}
