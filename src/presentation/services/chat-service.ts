import type { SendMessageInput } from '@application/chat/send-message-types'
import type { NewChatMessage } from '@domain/chat/chat-message'
import { api } from '../adapters/fortress-api'
import { useChatStore } from '../stores/chat-store'
import { useRunMeterStore } from '../stores/run-meter-store'
import { refreshSessionUsage } from './telemetry-service'
import { draftAssistantMessage, draftUserMessage } from './streaming-message'

/** Carga el historial persistido de un proyecto en el store. */
export async function loadHistory(projectId: string): Promise<void> {
  const messages = await api().chat.history(projectId)
  useChatStore.getState().setMessages(projectId, messages)
}

/** Persiste un mensaje suelto y lo agrega solo si SQLite lo acepto. */
export async function persistMessage(message: NewChatMessage): Promise<string | null> {
  const result = await api().chat.append(message)
  if (!result.ok) return result.error

  useChatStore.getState().appendMessage(result.value)
  return null
}

/**
 * Envia la peticion a Claude pintando la respuesta segun llega. Al terminar
 * recarga el historial: la UI acaba mostrando exactamente lo persistido, tanto
 * si la respuesta se completo como si fallo a medias.
 */
export async function sendMessage(input: SendMessageInput): Promise<void> {
  const store = useChatStore.getState()
  const draft = draftAssistantMessage(input.projectId, input.mode)

  store.setError(input.projectId, null)
  store.setStreaming(input.projectId, true)
  useRunMeterStore.getState().begin(Date.now())
  store.appendMessage(draftUserMessage(input.projectId, input.prompt, input.mode))
  store.appendMessage(draft)

  let buffer = ''
  const unsubscribe = api().chat.onChunk((chunk) => {
    if (chunk.projectId !== input.projectId) return
    buffer += chunk.delta
    useChatStore.getState().replaceMessage(draft.id, { ...draft, content: buffer })
  })
  const unmeter = api().chat.onProgress((p) => {
    if (p.projectId === input.projectId) {
      useRunMeterStore.getState().progress(p.index, p.total, p.tokens, p.costUsd)
    }
  })

  try {
    const result = await api().chat.send(input)
    if (!result.ok) useChatStore.getState().setError(input.projectId, result.error)
  } finally {
    unsubscribe()
    unmeter()
    useRunMeterStore.getState().end()
    useChatStore.getState().setStreaming(input.projectId, false)
    await Promise.all([loadHistory(input.projectId), refreshSessionUsage()])
  }
}

export async function clearHistory(projectId: string): Promise<void> {
  await api().chat.clear(projectId)
  useChatStore.getState().setMessages(projectId, [])
}

/**
 * Detiene el workflow en marcha. Mata el paso actual y evita que arranquen los
 * siguientes; lo ya guardado se queda guardado.
 */
export async function stopWorkflow(projectId: string): Promise<void> {
  await api().chat.stop(projectId)
}
