import { ipcRenderer } from 'electron'
import { IPC } from '@infrastructure/ipc/channels'
import type { FortressApi } from './api-types'
import { subscribe } from './subscribe'

/** Grupo repair del puente, extraido de index.ts por el limite de 75. */
export const repairApi: FortressApi['repair'] = {
  propose: (projectId, findingId) => ipcRenderer.invoke(IPC.repairPropose, projectId, findingId),
  verify: (projectId, findingId) => ipcRenderer.invoke(IPC.findingVerify, projectId, findingId), // prettier-ignore
  verifyAll: (projectId) => ipcRenderer.invoke(IPC.findingVerifyAll, projectId),
  verifySelected: (projectId, ids) => ipcRenderer.invoke(IPC.findingVerifySelected, projectId, ids), // prettier-ignore
  verifyAllStop: (projectId) => ipcRenderer.invoke(IPC.findingVerifyAllStop, projectId),
  list: (projectId) => ipcRenderer.invoke(IPC.repairList, projectId),
  cerco: (projectId) => ipcRenderer.invoke(IPC.repairCerco, projectId),
  cola: (projectId) => ipcRenderer.invoke(IPC.repairCola, projectId),
  get: (id) => ipcRenderer.invoke(IPC.repairGet, id),
  events: (proposalId) => ipcRenderer.invoke(IPC.repairEvents, proposalId),
  onChanged: (listener) => subscribe(IPC.repairChanged, listener),
  generate: (proposalId) => ipcRenderer.invoke(IPC.repairGenerate, proposalId),
  runGate: (proposalId) => ipcRenderer.invoke(IPC.repairRunGate, proposalId),
  runOmega: (proposalId) => ipcRenderer.invoke(IPC.repairRunOmega, proposalId),
  sign: (proposalId) => ipcRenderer.invoke(IPC.repairSign, proposalId),
  drain: (projectId) => ipcRenderer.invoke(IPC.repairDrain, projectId),
  drainStop: (projectId) => ipcRenderer.invoke(IPC.repairDrainStop, projectId),
  retry: (proposalId) => ipcRenderer.invoke(IPC.repairRetry, proposalId),
  withdraw: (proposalId, motivo) => ipcRenderer.invoke(IPC.repairWithdraw, proposalId, motivo),
  lazoCommit: (projectId, findingId) => ipcRenderer.invoke(IPC.repairLazoCommit, projectId, findingId), // prettier-ignore
  lazoStash: (projectId) => ipcRenderer.invoke(IPC.repairLazoStash, projectId),
  lazoPop: (projectId) => ipcRenderer.invoke(IPC.repairLazoPop, projectId)
}
