import { ipcRenderer } from 'electron'
import { IPC } from '@infrastructure/ipc/channels'
import type { FortressApi } from './api-types'
import { subscribe } from './subscribe'

/**
 * Mitad del puente: todo lo que cuelga de un proyecto. Separado de index.ts
 * solo por tamano; el contrato sigue siendo uno solo, FortressApi.
 */
export const projectApis: Pick<
  FortressApi,
  'scan' | 'push' | 'telemetry' | 'cognition' | 'graph' | 'maintenance' | 'activity' | 'newProject'
> = {
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
  push: {
    run: (projectId) => ipcRenderer.invoke(IPC.pushRun, projectId)
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
  newProject: {
    homeDirs: () => ipcRenderer.invoke(IPC.newProjectHomeDirs),
    planFolder: (draft) => ipcRenderer.invoke(IPC.newProjectPlanFolder, draft),
    createFolder: (draft, useExisting) =>
      ipcRenderer.invoke(IPC.newProjectCreateFolder, draft, useExisting)
  },
  maintenance: {
    liveJobs: () => ipcRenderer.invoke(IPC.maintenanceLiveJobs),
    cleanup: () => ipcRenderer.invoke(IPC.maintenanceCleanup)
  },
  activity: {
    byProject: (projectId, limit) => ipcRenderer.invoke(IPC.activityProject, projectId, limit),
    byAgent: (agentId, projectId, limit) =>
      ipcRenderer.invoke(IPC.activityAgent, agentId, projectId, limit),
    stats: (agentId, projectId) => ipcRenderer.invoke(IPC.agentStats, agentId, projectId)
  }
}
