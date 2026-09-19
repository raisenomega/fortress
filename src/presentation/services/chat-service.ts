import type { SendMessageInput } from '@application/chat/send-message-types'
import { ENVIO_SIN_DATO, type DesenlaceDelEnvio } from '@domain/chat/desenlace-del-envio'
import { api } from '../adapters/fortress-api'
import { useChatStore } from '../stores/chat-store'
import { useColaDelLoteStore } from '../stores/cola-del-lote-store'
import { useRunMeterStore } from '../stores/run-meter-store'
import { captureConfigDrafts } from './capture-config-drafts'
import { escucharElTurno } from './escuchar-el-turno'
import { conLoteDelPlan } from './lote-del-plan'
import { refreshSessionUsage } from './telemetry-service'
import { draftAssistantMessage, draftUserMessage } from './streaming-message'

/** Carga el historial persistido de un proyecto en el store. */
export async function loadHistory(projectId: string): Promise<void> {
  const messages = await api().chat.history(projectId)
  useChatStore.getState().setMessages(projectId, messages)
}

/** Envia la peticion a Claude pintando la respuesta segun llega; el finally
 *  recarga el historial persistido tanto si se completo como si fallo.
 *  Devuelve la guarda que corto el cierre del ciclo, si corto: la cola del lote
 *  la necesita para decir POR QUE no cerro en vez de agruparlo por descarte. */
export async function sendMessage(input: SendMessageInput): Promise<DesenlaceDelEnvio> {
  const store = useChatStore.getState()
  const draft = draftAssistantMessage(input.projectId, input.mode)

  store.setError(input.projectId, null)
  store.setStreaming(input.projectId, true)
  useRunMeterStore.getState().begin(Date.now())
  store.appendMessage(draftUserMessage(input.projectId, input.prompt, input.mode))
  store.appendMessage(draft)

  const dejarDeEscuchar = escucharElTurno(input.projectId, draft)

  let desenlace: DesenlaceDelEnvio = ENVIO_SIN_DATO
  try {
    const result = await api().chat.send(conLoteDelPlan(input))
    if (!result.ok) useChatStore.getState().setError(input.projectId, result.error)
    // Captura desde el texto PERSISTIDO (autoritativo), no el buffer efimero del
    // stream (que puede traer lineas de herramienta o venir vacio).
    else {
      // `plan` solo viene en el turno de plan de un lote en autonomo; en todo lo
      // demas el main no lo pone, y ausente significa «nadie lo juzgo».
      desenlace = { sinCierre: result.value.sinCierre, sinVerificar: result.value.sinVerificar, plan: result.value.plan ?? null } // prettier-ignore
      captureConfigDrafts(input.projectId, result.value.assistant.content)
    }
  } catch (error) {
    // Sin catch, un fallo del canal IPC seria un rechazo no manejado y el
    // finally recargaria el historial borrando el mensaje sin ninguna senal.
    const detail = error instanceof Error ? error.message : 'El chat se interrumpio'
    useChatStore.getState().setError(input.projectId, detail)
  } finally {
    dejarDeEscuchar()
    useRunMeterStore.getState().end()
    useChatStore.getState().setStreaming(input.projectId, false)
    await Promise.all([loadHistory(input.projectId), refreshSessionUsage()])
  }
  return desenlace
}

export async function clearHistory(projectId: string): Promise<void> {
  await api().chat.clear(projectId)
  useChatStore.getState().setMessages(projectId, [])
}

/**
 * Detiene TODO lo del proyecto: el run (chat o loop), el loop si corre, y el
 * lote —el corte va ANTES de matar el turno, para que al volver su promesa la
 * cola ya lo lea—. El input se libera YA; el finally del envio lo re-confirma.
 */
export async function stopWorkflow(projectId: string): Promise<void> {
  useColaDelLoteStore.getState().cortar(projectId)
  await api().chat.stop(projectId)
  useChatStore.getState().setStreaming(projectId, false)
}
