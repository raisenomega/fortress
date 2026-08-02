import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC } from '@infrastructure/ipc/channels'
import type { FortressApi } from './api-types'
import { subscribe } from './subscribe'

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
  scan: {
    run: (projectId) => ipcRenderer.invoke(IPC.scanRun, projectId),
    findings: (projectId) => ipcRenderer.invoke(IPC.scanFindings, projectId),
    counts: () => ipcRenderer.invoke(IPC.scanCounts),
    onProgress: (listener) => subscribe(IPC.scanProgress, listener),
    history: (projectId, limit) => ipcRenderer.invoke(IPC.scanHistory, projectId, limit),
    historySince: (iso) => ipcRenderer.invoke(IPC.scanHistorySince, iso),
    dismiss: (findingId) => ipcRenderer.invoke(IPC.scanDismiss, findingId),
    reopen: (findingId) => ipcRenderer.invoke(IPC.scanReopen, findingId)
  },
  telemetry: {
    session: () => ipcRenderer.invoke(IPC.telemetrySession),
    since: (iso) => ipcRenderer.invoke(IPC.telemetrySince, iso),
    byProject: (iso) => ipcRenderer.invoke(IPC.telemetryByProject, iso),
    ranking: (iso, limit) => ipcRenderer.invoke(IPC.telemetryRanking, iso, limit)
  },
  cognition: {
    read: (projectId) => ipcRenderer.invoke(IPC.cognitionRead, projectId)
  },
  graph: {
    status: (projectId) => ipcRenderer.invoke(IPC.graphStatus, projectId)
  },
  activity: {
    byProject: (projectId, limit) => ipcRenderer.invoke(IPC.activityProject, projectId, limit),
    byAgent: (agentId, projectId, limit) =>
      ipcRenderer.invoke(IPC.activityAgent, agentId, projectId, limit),
    stats: (agentId, projectId) => ipcRenderer.invoke(IPC.agentStats, agentId, projectId)
  },
  push: {
    run: (projectId) => ipcRenderer.invoke(IPC.pushRun, projectId)
  },
  chat: {
    history: (projectId) => ipcRenderer.invoke(IPC.chatHistory, projectId),
    append: (message) => ipcRenderer.invoke(IPC.chatAppend, message),
    clear: (projectId) => ipcRenderer.invoke(IPC.chatClear, projectId),
    send: (input) => ipcRenderer.invoke(IPC.chatSend, input),
    onChunk: (listener) => subscribe(IPC.chatChunk, listener)
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
