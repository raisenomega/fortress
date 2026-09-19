import type { ChatMessage } from '@domain/chat/chat-message'
import { api } from '../adapters/fortress-api'
import { useChatStore } from '../stores/chat-store'
import { useRunMeterStore } from '../stores/run-meter-store'

/**
 * Lo que un turno escucha mientras corre: el texto que llega por trozos —que se
 * pinta sobre el borrador— y el medidor de consumo. Devuelve el corte de las
 * dos suscripciones, que el `finally` del envio tiene que llamar siempre.
 *
 * El buffer vive aqui y no en el store porque es EFIMERO: el texto autoritativo
 * es el que queda persistido, y el historial se recarga al terminar.
 */
export function escucharElTurno(projectId: string, draft: ChatMessage): () => void {
  let buffer = ''
  const sinChunks = api().chat.onChunk((chunk) => {
    if (chunk.projectId !== projectId) return
    buffer += chunk.delta
    useChatStore.getState().replaceMessage(draft.id, { ...draft, content: buffer })
  })
  const sinMedidor = api().chat.onProgress((p) => {
    if (p.projectId === projectId) {
      useRunMeterStore.getState().progress(p)
    }
  })

  return () => {
    sinChunks()
    sinMedidor()
  }
}
