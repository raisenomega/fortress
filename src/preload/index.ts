import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC } from '@infrastructure/ipc/channels'
import type { FortressApi } from './api-types'
import { subscribe } from './subscribe'
import { connectorsApi } from './connectors-impl'
import { projectApis } from './project-apis'

/**
 * Superficie minima expuesta al renderer: solo estas operaciones, nada de
 * `ipcRenderer` en crudo ni acceso a Node. La API key de Claude jamas cruza
 * este puente — se cifra, se guarda y se usa en el proceso principal.
 */
const api: FortressApi = {
  ...projectApis,
  connectors: connectorsApi,
  projects: {
    list: () => ipcRenderer.invoke(IPC.projectsList),
    add: (input) => ipcRenderer.invoke(IPC.projectsAdd, input),
    remove: (id) => ipcRenderer.invoke(IPC.projectsRemove, id),
    pickFolder: () => ipcRenderer.invoke(IPC.projectsPickFolder),
    self: () => ipcRenderer.invoke(IPC.projectsSelf),
    setTrusted: (id, trusted) => ipcRenderer.invoke(IPC.projectsSetTrusted, id, trusted)
  },
  health: {
    run: () => ipcRenderer.invoke(IPC.healthRun)
  },
  omega: {
    audit: (projectId) => ipcRenderer.invoke(IPC.omegaAudit, projectId),
    list: (projectId) => ipcRenderer.invoke(IPC.omegaList, projectId),
    score: (projectId) => ipcRenderer.invoke(IPC.omegaScore, projectId),
    agents: (projectId) => ipcRenderer.invoke(IPC.omegaAgents, projectId),
    runs: (projectId) => ipcRenderer.invoke(IPC.omegaRuns, projectId),
    snippet: (projectId, file, line) => ipcRenderer.invoke(IPC.omegaSnippet, projectId, file, line)
  },
  chat: {
    history: (projectId) => ipcRenderer.invoke(IPC.chatHistory, projectId),
    append: (message) => ipcRenderer.invoke(IPC.chatAppend, message),
    clear: (projectId) => ipcRenderer.invoke(IPC.chatClear, projectId),
    send: (input) => ipcRenderer.invoke(IPC.chatSend, input),
    stop: (projectId) => ipcRenderer.invoke(IPC.chatStop, projectId),
    onChunk: (listener) => subscribe(IPC.chatChunk, listener),
    onProgress: (listener) => subscribe(IPC.chatProgress, listener)
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
