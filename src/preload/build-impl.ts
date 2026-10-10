import { ipcRenderer } from 'electron'
import { IPC } from '@infrastructure/ipc/channels'
import type { BuildApi } from './build-api'

/** Implementacion del puente de construccion (preload). El tipo vive aparte. */
export const buildApi: BuildApi = {
  plan: (projectId, intent) => ipcRenderer.invoke(IPC.buildPlan, projectId, intent),
  investigate: (projectId, intent) => ipcRenderer.invoke(IPC.buildInvestigate, projectId, intent),
  libre: (pregunta, hilo) => ipcRenderer.invoke(IPC.buildLibre, pregunta, hilo),
  cto: (pregunta, hilo, ancla) => ipcRenderer.invoke(IPC.buildCto, pregunta, hilo, ancla),
  feature: (projectId, intent, plan) =>
    ipcRenderer.invoke(IPC.buildFeature, projectId, intent, plan),
  stop: (projectId) => ipcRenderer.invoke(IPC.buildStop, projectId),
  pickFile: () => ipcRenderer.invoke(IPC.buildPickFile)
}
