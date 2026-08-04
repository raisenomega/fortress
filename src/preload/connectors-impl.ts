import { ipcRenderer } from 'electron'
import { IPC } from '@infrastructure/ipc/channels'
import type { ConnectorsApi } from './connectors-api'

/** Implementacion del puente de conectores (preload). El tipo vive aparte. */
export const connectorsApi: ConnectorsApi = {
  list: () => ipcRenderer.invoke(IPC.connectorsList),
  setEnabled: (id, on) => ipcRenderer.invoke(IPC.connectorsSetEnabled, id, on),
  add: (input) => ipcRenderer.invoke(IPC.connectorsAdd, input),
  remove: (id) => ipcRenderer.invoke(IPC.connectorsRemove, id)
}
