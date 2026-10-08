import { ipcRenderer } from 'electron'
import { IPC } from '@infrastructure/ipc/channels'
import type { ChatApi } from './core-apis'
import { subscribe } from './subscribe'

/** El bloque `chat` del puente, aparte por el techo de lineas (molde de
 *  connectors-impl): historial, hilos del multi-chat (B1) y la barra de
 *  carpetas (PASO 116). */
export const chatApi: ChatApi = {
  history: (projectId) => ipcRenderer.invoke(IPC.chatHistory, projectId),
  append: (message) => ipcRenderer.invoke(IPC.chatAppend, message),
  clear: (projectId) => ipcRenderer.invoke(IPC.chatClear, projectId),
  send: (input) => ipcRenderer.invoke(IPC.chatSend, input),
  stop: (projectId) => ipcRenderer.invoke(IPC.chatStop, projectId),
  onChunk: (listener) => subscribe(IPC.chatChunk, listener),
  onProgress: (listener) => subscribe(IPC.chatProgress, listener),
  createHilo: (nuevo) => ipcRenderer.invoke(IPC.chatCreateHilo, nuevo),
  listHilos: (projectId) => ipcRenderer.invoke(IPC.chatListHilos, projectId),
  listByHilo: (chatId) => ipcRenderer.invoke(IPC.chatListByHilo, chatId),
  addToHilo: (chatId, mensaje) => ipcRenderer.invoke(IPC.chatAddToHilo, chatId, mensaje),
  listarCarpetas: () => ipcRenderer.invoke(IPC.chatListarCarpetas),
  listarSueltos: () => ipcRenderer.invoke(IPC.chatListarSueltos),
  borrarHilo: (hiloId) => ipcRenderer.invoke(IPC.chatBorrarHilo, hiloId),
  crearCarpeta: (nombre) => ipcRenderer.invoke(IPC.chatCrearCarpeta, nombre),
  hilosPorCarpeta: (carpetaId) => ipcRenderer.invoke(IPC.chatHilosPorCarpeta, carpetaId)
}
