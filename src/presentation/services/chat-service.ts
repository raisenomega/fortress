import type { SendMessageInput } from '@application/chat/send-message-types'
import { api } from '../adapters/fortress-api'
import { useChatStore } from '../stores/chat-store'
import { useColaDelLoteStore } from '../stores/cola-del-lote-store'
import { useRunMeterStore } from '../stores/run-meter-store'
import { captureConfigDrafts } from './capture-config-drafts'
import { refreshSessionUsage } from './telemetry-service'
import { draftAssistantMessage, draftUserMessage } from './streaming-message'

/** Carga el historial persistido de un proyecto en el store. */
export async function loadHistory(projectId: string): Promise<void> {
  const messages = await api().chat.history(projectId)
  useChatStore.getState().setMessages(projectId, messages)
}

/** Envia la peticion a Claude pintando la respuesta segun llega; el finally
 *  recarga el historial persistido tanto si se completo como si fallo. */
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
    // Captura desde el texto PERSISTIDO (autoritativo), no el buffer efimero del
    // stream (que puede traer lineas de herramienta o venir vacio).
    else captureConfigDrafts(input.projectId, result.value.assistant.content)
  } catch (error) {
    // Sin catch, un fallo del canal IPC seria un rechazo no manejado y el
    // finally recargaria el historial borrando el mensaje sin ninguna senal.
    const detail = error instanceof Error ? error.message : 'El chat se interrumpio'
    useChatStore.getState().setError(input.projectId, detail)
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
 * Detiene TODO lo del proyecto: el run en curso (chat o loop) y el loop si
 * corre. El input se libera YA: aunque un stream zombi suelte bytes un momento
 * mas, el operador recupera el control; el finally del envio lo re-confirma.
 */
export async function stopWorkflow(projectId: string): Promise<void> {
  // ANTES de matar el turno: al volver su promesa, la cola ya lee el corte.
  useColaDelLoteStore.getState().cortar(projectId)
  await api().chat.stop(projectId)
  useChatStore.getState().setStreaming(projectId, false)
}
