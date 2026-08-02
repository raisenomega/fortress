import type { ChatMessage } from '@domain/chat/chat-message'
import { useChatStore } from './chat-store'

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

export function useProjectStreaming(projectId: string | null): boolean {
  return useChatStore((state) =>
    projectId ? (state.streamingByProject[projectId] ?? false) : false
  )
}

export function useProjectError(projectId: string | null): string | null {
  return useChatStore((state) => (projectId ? (state.errorByProject[projectId] ?? null) : null))
}
