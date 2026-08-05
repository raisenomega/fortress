import { ipcRenderer } from 'electron'
import { IPC } from '@infrastructure/ipc/channels'
import type { BuildApi } from './build-api'

/** Implementacion del puente de construccion (preload). El tipo vive aparte. */
export const buildApi: BuildApi = {
  plan: (projectId, intent) => ipcRenderer.invoke(IPC.buildPlan, projectId, intent),
  feature: (projectId, intent, plan) =>
    ipcRenderer.invoke(IPC.buildFeature, projectId, intent, plan)
}
