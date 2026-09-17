import type { IpcMainInvokeEvent } from 'electron'
import { sinSecretosEnVivo } from '@application/chat/en-vivo-tachado'
import type { StepProgress } from '@application/workflow/step-progress'
import type { ChatChunk, ChatProgress } from '@domain/chat/chat-stream'
import { IPC } from './channels'

/** Solo si la ventana sigue viva, y tachado. `sendMessage` ya envuelve aguas
 *  arriba; se envuelve OTRA VEZ a proposito: tachar es idempotente y una puerta
 *  que se protege sola no depende de que quien la llame se acuerde. */
export function chunkSender(event: IpcMainInvokeEvent, projectId: string): (d: string) => void {
  return sinSecretosEnVivo((delta: string): void => {
    if (event.sender.isDestroyed()) return
    const chunk: ChatChunk = { projectId, delta }
    event.sender.send(IPC.chatChunk, chunk)
  })
}

/** Manda el avance del workflow para el medidor en vivo (agentes/tokens/coste). */
export function progressSender(event: IpcMainInvokeEvent, projectId: string) {
  return (p: StepProgress): void => {
    if (event.sender.isDestroyed()) return
    const message: ChatProgress = { projectId, ...p }
    event.sender.send(IPC.chatProgress, message)
  }
}
