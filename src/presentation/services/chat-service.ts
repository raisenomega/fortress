import type { NewChatMessage } from '@domain/chat/chat-message'
import { api } from '../adapters/fortress-api'
import { useChatStore } from '../stores/chat-store'

/** Carga el historial persistido de un proyecto en el store. */
export async function loadHistory(projectId: string): Promise<void> {
  const messages = await api().chat.history(projectId)
  useChatStore.getState().setMessages(projectId, messages)
}

/**
 * Persiste un mensaje y lo agrega al store solo si SQLite lo acepto: asi la
 * UI nunca muestra algo que no quedo guardado.
 */
export async function persistMessage(message: NewChatMessage): Promise<string | null> {
  const result = await api().chat.append(message)
  if (!result.ok) return result.error

  useChatStore.getState().appendMessage(result.value)
  return null
}

export async function clearHistory(projectId: string): Promise<void> {
  await api().chat.clear(projectId)
  useChatStore.getState().setMessages(projectId, [])
}
