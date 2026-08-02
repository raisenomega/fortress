import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC } from '@infrastructure/ipc/channels'
import type { FortressApi } from './api-types'

/**
 * Superficie minima expuesta al renderer: solo estas operaciones, nada de
 * `ipcRenderer` en crudo ni acceso a Node. La API key de Claude jamas cruza
 * este puente — vive y se usa en el proceso principal.
 */
const api: FortressApi = {
  projects: {
    list: () => ipcRenderer.invoke(IPC.projectsList),
    add: (input) => ipcRenderer.invoke(IPC.projectsAdd, input),
    remove: (id) => ipcRenderer.invoke(IPC.projectsRemove, id)
  },
  chat: {
    history: (projectId) => ipcRenderer.invoke(IPC.chatHistory, projectId),
    append: (message) => ipcRenderer.invoke(IPC.chatAppend, message),
    clear: (projectId) => ipcRenderer.invoke(IPC.chatClear, projectId)
  },
  settings: {
    get: (key) => ipcRenderer.invoke(IPC.settingsGet, key),
    set: (key, value) => ipcRenderer.invoke(IPC.settingsSet, key, value)
  }
}

// contextIsolation esta forzado a true en main-window.ts, asi que este es el
// unico camino: no hay fallback que escriba sobre `window` directamente.
contextBridge.exposeInMainWorld('electron', electronAPI)
contextBridge.exposeInMainWorld('api', api)
