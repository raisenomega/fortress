import { ipcMain } from 'electron'
import { appendMessage, clearHistory, getHistory } from '@application/chat/chat-history'
import type { NewChatMessage } from '@domain/chat/chat-message'
import type { MensajeDeHilo } from '@domain/chat/chat-repository'
import { redactSecrets } from '@domain/chat/tool-detail'
import type { NuevoHilo } from '@domain/chat/hilo-de-chat'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

export function registerChatHandlers(): void {
  ipcMain.handle(IPC.chatHistory, (_event, projectId: string) =>
    getHistory(getAppContext(), projectId)
  )

  ipcMain.handle(IPC.chatAppend, (_event, message: NewChatMessage) =>
    appendMessage(getAppContext(), message)
  )

  ipcMain.handle(IPC.chatClear, (_event, projectId: string) => {
    clearHistory(getAppContext(), projectId)
  })

  // Los HILOS del multi-chat (B1): el puente que B0 dejo pendiente. El repo
  // vive en main; sin estos cuatro el renderer no alcanza el cajon.
  ipcMain.handle(IPC.chatCreateHilo, (_e, nuevo: NuevoHilo) =>
    getAppContext().chat.createChat(nuevo)
  )
  ipcMain.handle(IPC.chatListHilos, (_e, projectId: string | null) =>
    getAppContext().chat.listChats(projectId)
  )
  ipcMain.handle(IPC.chatListByHilo, (_e, chatId: string) =>
    getAppContext().chat.listByChat(chatId)
  )
  // El tachado vive en main (el renderer no es de confianza): ningun secreto a la fila.
  ipcMain.handle(IPC.chatAddToHilo, (_e, chatId: string, mensaje: MensajeDeHilo) =>
    getAppContext().chat.addToChat(chatId, { ...mensaje, content: redactSecrets(mensaje.content) })
  )

  // La barra de carpetas (PASO 116): listas del organizador y el borrado.
  ipcMain.handle(IPC.chatListarCarpetas, () => getAppContext().chat.listarCarpetas())
  ipcMain.handle(IPC.chatListarSueltos, () => getAppContext().chat.listarHilosSueltos())
  ipcMain.handle(IPC.chatBorrarHilo, (_e, hiloId: string) => {
    getAppContext().chat.borrarHilo(hiloId)
  })

  // Los flujos de la Fase 3: crear carpeta y la pagina que lista lo suyo.
  ipcMain.handle(IPC.chatCrearCarpeta, (_e, nombre: string) =>
    getAppContext().chat.crearCarpeta(nombre)
  )
  ipcMain.handle(IPC.chatHilosPorCarpeta, (_e, carpetaId: string) =>
    getAppContext().chat.listarHilosPorCarpeta(carpetaId)
  )
  registrarGestionDelChat()
}

/** La gestion del ⋯ (Revision B, PASO 121): renombrar, mover y borrar.
 *  Sin catch propio: los cuatro caen del lado OBSERVADO del embudo. */
function registrarGestionDelChat(): void {
  ipcMain.handle(IPC.chatRenombrarHilo, (_e, hiloId: string, titulo: string) => {
    getAppContext().chat.renombrarHilo(hiloId, titulo)
  })
  ipcMain.handle(IPC.chatMoverHilo, (_e, hiloId: string, carpetaId: string | null) => {
    getAppContext().chat.moverHilo(hiloId, carpetaId)
  })
  ipcMain.handle(IPC.chatRenombrarCarpeta, (_e, id: string, nombre: string) => {
    getAppContext().chat.renombrarCarpeta(id, nombre)
  })
  ipcMain.handle(IPC.chatBorrarCarpeta, (_e, id: string, modo: 'mover' | 'con-hilos') => {
    if (modo === 'con-hilos') getAppContext().chat.borrarCarpetaConHilos(id)
    else getAppContext().chat.borrarCarpeta(id)
  })
}
