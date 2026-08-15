import { ipcRenderer } from 'electron'
import { IPC } from '@infrastructure/ipc/channels'
import type { FortressApi } from './api-types'
import { subscribe } from './subscribe'

/** Grupo repair del puente, extraido de index.ts por el limite de 75. */
export const repairApi: FortressApi['repair'] = {
  propose: (projectId) => ipcRenderer.invoke(IPC.repairPropose, projectId),
  list: (projectId) => ipcRenderer.invoke(IPC.repairList, projectId),
  get: (id) => ipcRenderer.invoke(IPC.repairGet, id),
  events: (proposalId) => ipcRenderer.invoke(IPC.repairEvents, proposalId),
  onChanged: (listener) => subscribe(IPC.repairChanged, listener),
  generate: (proposalId) => ipcRenderer.invoke(IPC.repairGenerate, proposalId),
  runGate: (proposalId) => ipcRenderer.invoke(IPC.repairRunGate, proposalId),
  runOmega: (proposalId) => ipcRenderer.invoke(IPC.repairRunOmega, proposalId),
  retry: (proposalId) => ipcRenderer.invoke(IPC.repairRetry, proposalId)
}
