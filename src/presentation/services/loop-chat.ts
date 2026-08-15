import type { ChatMessage } from '@domain/chat/chat-message'
import type { LoopStatus } from '@domain/loop/loop-status'
import { api } from '../adapters/fortress-api'
import { useChatStore } from '../stores/chat-store'
import { draftAssistantMessage } from './streaming-message'

/** Borrador en curso del loop, por proyecto. Se ve en vivo; se cierra al cambiar de fase. */
const drafts = new Map<string, ChatMessage>()

/** Fases que CIERRAN el mensaje anterior (nueva fase con salida propia, o fin). */
const CLOSES: ReadonlySet<string> = new Set(['escaneando', 'reparando', 'esperando', 'parado'])

function finalize(projectId: string): void {
  const draft = drafts.get(projectId)
  if (!draft) return
  drafts.delete(projectId)
  useChatStore.getState().replaceMessage(draft.id, { ...draft, pending: false })
}

/**
 * Pinta la salida EN VIVO del loop en el chat del proyecto. Llega por su canal
 * propio (loop:chunk), asi que se muestra SIEMPRE, sin depender de haber recibido
 * antes el estado (evita la carrera al reanudar) y sin pisar un chat manual, que
 * usa otro canal. Cada fase con salida es un mensaje; al cambiar de fase se cierra.
 */
export function subscribeLoopChat(): () => void {
  const offChunk = api().chat.onLoopChunk((chunk) => {
    const nuevo = !drafts.has(chunk.projectId)
    const base = drafts.get(chunk.projectId) ?? draftAssistantMessage(chunk.projectId, 'autonomo')
    if (nuevo) useChatStore.getState().appendMessage(base)
    const next = { ...base, content: base.content + chunk.delta }
    drafts.set(chunk.projectId, next)
    useChatStore.getState().replaceMessage(next.id, next)
  })
  const offStatus = api().chat.onLoopStatus((status: LoopStatus) => {
    if (CLOSES.has(status.phase)) finalize(status.projectId)
  })
  return () => {
    offChunk()
    offStatus()
  }
}
