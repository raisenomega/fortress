import { ipcRenderer } from 'electron'
import { IPC } from '@infrastructure/ipc/channels'
import type { FortressApi } from './api-types'

/** Grupo repair del puente, extraido de index.ts por el limite de 75. */
export const repairApi: FortressApi['repair'] = {
  self: () => ipcRenderer.invoke(IPC.repairSelf),
  propose: (projectId) => ipcRenderer.invoke(IPC.repairPropose, projectId),
  list: (projectId) => ipcRenderer.invoke(IPC.repairList, projectId),
  get: (id) => ipcRenderer.invoke(IPC.repairGet, id),
  events: (proposalId) => ipcRenderer.invoke(IPC.repairEvents, proposalId),
  generate: (proposalId) => ipcRenderer.invoke(IPC.repairGenerate, proposalId),
  runGate: (proposalId) => ipcRenderer.invoke(IPC.repairRunGate, proposalId),
  runOmega: (proposalId) => ipcRenderer.invoke(IPC.repairRunOmega, proposalId)
}
