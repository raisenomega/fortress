import { ipcRenderer } from 'electron'
import { IPC } from '@infrastructure/ipc/channels'
import type { FortressApi } from './api-types'
import { subscribe } from './subscribe'

/** Grupo graph del puente, extraido de project-apis por el limite de 75. */
export const graphApi: FortressApi['graph'] = {
  status: (projectId) => ipcRenderer.invoke(IPC.graphStatus, projectId),
  install: (projectId) => ipcRenderer.invoke(IPC.graphInstall, projectId),
  verify: (projectId) => ipcRenderer.invoke(IPC.graphVerify, projectId),
  ab: (projectId, question) => ipcRenderer.invoke(IPC.graphAb, projectId, question),
  onProgress: (listener) => subscribe(IPC.graphProgress, listener),
  reindex: (projectId) => ipcRenderer.invoke(IPC.graphReindex, projectId),
  state: (projectId) => ipcRenderer.invoke(IPC.graphState, projectId),
  focus: (projectId) => ipcRenderer.invoke(IPC.projectsFocus, projectId),
  onReindexChanged: (listener) => subscribe(IPC.graphReindexChanged, listener)
}
