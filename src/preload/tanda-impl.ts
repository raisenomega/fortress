import { ipcRenderer } from 'electron'
import { IPC } from '@infrastructure/ipc/channels'
import type { TandaApi } from './tanda-api'

/** Grupo tanda del puente: la guia del orden de firma (deuda #2). */
export const tandaApi: TandaApi = {
  guia: (projectId) => ipcRenderer.invoke(IPC.repairGuiaDeFirma, projectId),
  medir: (projectId) => ipcRenderer.invoke(IPC.repairMedirTanda, projectId)
}
