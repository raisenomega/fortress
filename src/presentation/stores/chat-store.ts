import { create } from 'zustand'
import type { ChatMessage } from '@domain/chat/chat-message'

interface ChatState {
  /** Historial por proyecto: cada proyecto tiene su propia conversacion. */
  readonly byProject: Readonly<Record<string, readonly ChatMessage[]>>
  /**
   * Estado de ejecucion y error, TAMBIEN por proyecto. Antes eran un solo
   * valor global: si el proyecto A estaba respondiendo y cambiabas a B, el chat
   * de B aparecia bloqueado y con el error de A. Cada proyecto lleva el suyo.
   */
  readonly streamingByProject: Readonly<Record<string, boolean>>
  readonly errorByProject: Readonly<Record<string, string | null>>
  setMessages: (projectId: string, messages: readonly ChatMessage[]) => void
  appendMessage: (message: ChatMessage) => void
  replaceMessage: (id: string, message: ChatMessage) => void
  setStreaming: (projectId: string, streaming: boolean) => void
  setError: (projectId: string, error: string | null) => void
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
  streamingByProject: {},
  errorByProject: {},

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

  setStreaming: (projectId, streaming) =>
    set((state) => ({
      streamingByProject: { ...state.streamingByProject, [projectId]: streaming }
    })),

  setError: (projectId, error) =>
    set((state) => ({ errorByProject: { ...state.errorByProject, [projectId]: error } }))
}))
