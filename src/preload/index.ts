import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { ChatChunk } from '@domain/chat/chat-stream'
import { IPC } from '@infrastructure/ipc/channels'
import type { FortressApi } from './api-types'

/**
 * Superficie minima expuesta al renderer: solo estas operaciones, nada de
 * `ipcRenderer` en crudo ni acceso a Node. La API key de Claude jamas cruza
 * este puente — se cifra, se guarda y se usa en el proceso principal.
 */
const api: FortressApi = {
  projects: {
    list: () => ipcRenderer.invoke(IPC.projectsList),
    add: (input) => ipcRenderer.invoke(IPC.projectsAdd, input),
    remove: (id) => ipcRenderer.invoke(IPC.projectsRemove, id),
    pickFolder: () => ipcRenderer.invoke(IPC.projectsPickFolder),
    self: () => ipcRenderer.invoke(IPC.projectsSelf)
  },
  health: {
    run: () => ipcRenderer.invoke(IPC.healthRun)
  },
  chat: {
    history: (projectId) => ipcRenderer.invoke(IPC.chatHistory, projectId),
    append: (message) => ipcRenderer.invoke(IPC.chatAppend, message),
    clear: (projectId) => ipcRenderer.invoke(IPC.chatClear, projectId),
    send: (input) => ipcRenderer.invoke(IPC.chatSend, input),
    onChunk: (listener) => {
      const handler = (_event: IpcRendererEvent, chunk: ChatChunk): void => listener(chunk)
      ipcRenderer.on(IPC.chatChunk, handler)
      return () => {
        ipcRenderer.off(IPC.chatChunk, handler)
      }
    }
  },
  settings: {
    get: (key) => ipcRenderer.invoke(IPC.settingsGet, key),
    set: (key, value) => ipcRenderer.invoke(IPC.settingsSet, key, value),
    saveApiKey: (plainKey) => ipcRenderer.invoke(IPC.settingsSaveApiKey, plainKey),
    hasApiKey: () => ipcRenderer.invoke(IPC.settingsHasApiKey),
    checkApiKey: () => ipcRenderer.invoke(IPC.settingsCheckApiKey),
    clearApiKey: () => ipcRenderer.invoke(IPC.settingsClearApiKey)
  }
}

// contextIsolation esta forzado a true en main-window.ts, asi que este es el
// unico camino: no hay fallback que escriba sobre `window` directamente.
contextBridge.exposeInMainWorld('electron', electronAPI)
contextBridge.exposeInMainWorld('api', api)
