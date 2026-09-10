import { ipcRenderer } from 'electron'
import { IPC } from '@infrastructure/ipc/channels'
import type { FortressApi } from './api-types'
import { subscribe } from './subscribe'
import { graphApi } from './graph-impl'

/** Mitad del puente: todo lo que cuelga de un proyecto. Separado de index.ts
 *  solo por tamano; el contrato sigue siendo uno solo, FortressApi. */
export const projectApis: Pick<
  FortressApi,
  | 'scan'
  | 'quality'
  | 'push'
  | 'telemetry'
  | 'cognition'
  | 'graph'
  | 'maintenance'
  | 'activity'
  | 'newProject'
  | 'account'
  | 'posture'
> = {
  scan: {
    run: (projectId) => ipcRenderer.invoke(IPC.scanRun, projectId),
    findings: (projectId) => ipcRenderer.invoke(IPC.scanFindings, projectId),
    counts: () => ipcRenderer.invoke(IPC.scanCounts),
    onProgress: (listener) => subscribe(IPC.scanProgress, listener),
    stop: (projectId) => ipcRenderer.invoke(IPC.scanStop, projectId),
    history: (projectId, limit) => ipcRenderer.invoke(IPC.scanHistory, projectId, limit),
    historySince: (iso) => ipcRenderer.invoke(IPC.scanHistorySince, iso),
    dismiss: (findingId) => ipcRenderer.invoke(IPC.scanDismiss, findingId),
    reopen: (findingId) => ipcRenderer.invoke(IPC.scanReopen, findingId),
    mitigate: (findingId, note) => ipcRenderer.invoke(IPC.scanMitigate, findingId, note),
    unmitigate: (findingId) => ipcRenderer.invoke(IPC.scanUnmitigate, findingId)
  },
  quality: { run: (projectId) => ipcRenderer.invoke(IPC.qualityRun, projectId) },
  push: { run: (projectId) => ipcRenderer.invoke(IPC.pushRun, projectId) },
  posture: { run: (request) => ipcRenderer.invoke(IPC.postureRun, request) },
  account: {
    status: () => ipcRenderer.invoke(IPC.accountStatus),
    login: () => ipcRenderer.invoke(IPC.accountLogin),
    onOutput: (listener) => subscribe(IPC.accountLoginOutput, listener)
  },
  telemetry: {
    billing: () => ipcRenderer.invoke(IPC.telemetryBilling),
    averageRun: (projectId) => ipcRenderer.invoke(IPC.telemetryAverage, projectId),
    session: () => ipcRenderer.invoke(IPC.telemetrySession),
    since: (iso) => ipcRenderer.invoke(IPC.telemetrySince, iso),
    byProject: (iso) => ipcRenderer.invoke(IPC.telemetryByProject, iso),
    sinFactura: (iso) => ipcRenderer.invoke(IPC.telemetrySinFactura, iso),
    ranking: (iso, limit) => ipcRenderer.invoke(IPC.telemetryRanking, iso, limit)
  },
  cognition: { read: (projectId) => ipcRenderer.invoke(IPC.cognitionRead, projectId) },
  graph: graphApi,
  newProject: {
    homeDirs: () => ipcRenderer.invoke(IPC.newProjectHomeDirs),
    planFolder: (draft) => ipcRenderer.invoke(IPC.newProjectPlanFolder, draft),
    createFolder: (draft, useExisting) =>
      ipcRenderer.invoke(IPC.newProjectCreateFolder, draft, useExisting),
    register: (input) => ipcRenderer.invoke(IPC.newProjectRegister, input),
    execute: (projectId, drafts) => ipcRenderer.invoke(IPC.configExecute, projectId, drafts)
  },
  maintenance: {
    liveJobs: () => ipcRenderer.invoke(IPC.maintenanceLiveJobs),
    cleanup: () => ipcRenderer.invoke(IPC.maintenanceCleanup),
    keepAwake: (enable) => ipcRenderer.invoke(IPC.maintenanceKeepAwake, enable)
  },
  activity: {
    byProject: (projectId, limit) => ipcRenderer.invoke(IPC.activityProject, projectId, limit),
    byAgent: (agentId, projectId, limit) =>
      ipcRenderer.invoke(IPC.activityAgent, agentId, projectId, limit),
    stats: (agentId, projectId) => ipcRenderer.invoke(IPC.agentStats, agentId, projectId)
  }
}
