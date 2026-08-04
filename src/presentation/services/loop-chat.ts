import type { ChatMessage } from '@domain/chat/chat-message'
import type { LoopStatus } from '@domain/loop/loop-status'
import { api } from '../adapters/fortress-api'
import { useChatStore } from '../stores/chat-store'
import { useLoopStore } from '../stores/loop-store'
import { draftAssistantMessage } from './streaming-message'

/** Borrador en curso del loop, por proyecto. Se ve en vivo; se cierra al cambiar de fase. */
const drafts = new Map<string, ChatMessage>()

/** Fases que CIERRAN el mensaje anterior (nueva fase con salida propia, o fin). */
const CLOSES: ReadonlySet<string> = new Set(['escaneando', 'reparando', 'debate', 'esperando', 'parado'])

function loopActive(projectId: string): boolean {
  const status = useLoopStore.getState().byProject[projectId]
  return status !== undefined && status.stopReason === null
}

function finalize(projectId: string): void {
  const draft = drafts.get(projectId)
  if (!draft) return
  drafts.delete(projectId)
  useChatStore.getState().replaceMessage(draft.id, { ...draft, pending: false })
}

/**
 * Pinta la salida EN VIVO del loop en el chat del proyecto, igual que una
 * corrida normal: el main reenvia los chunks y aqui se acumulan en un mensaje.
 * Cada fase con salida es un mensaje; al cambiar de fase se cierra el anterior.
 * Solo actua si el loop de ese proyecto esta activo (no pisa un chat manual).
 */
export function subscribeLoopChat(): () => void {
  const offChunk = api().chat.onChunk((chunk) => {
    if (!loopActive(chunk.projectId)) return
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
