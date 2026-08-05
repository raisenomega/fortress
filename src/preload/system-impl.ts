import { ipcRenderer } from 'electron'
import { IPC } from '@infrastructure/ipc/channels'
import type { SelfImprovementApi } from './self-improvement-api'

/** Implementacion del puente del subsistema de auto-mejora (system:*). */
export const systemApi: SelfImprovementApi = {
  observations: () => ipcRenderer.invoke(IPC.systemObservations),
  resolveObservation: (id) => ipcRenderer.invoke(IPC.systemResolveObservation, id),
  proposeCapability: (input) => ipcRenderer.invoke(IPC.systemProposeCapability, input),
  capabilities: () => ipcRenderer.invoke(IPC.systemCapabilities),
  promoteCapability: (id, human) => ipcRenderer.invoke(IPC.systemPromoteCapability, id, human),
  capabilityNotes: (id) => ipcRenderer.invoke(IPC.systemCapabilityNotes, id),
  addCapabilityNote: (input) => ipcRenderer.invoke(IPC.systemAddCapabilityNote, input),
  agentDraft: (id) => ipcRenderer.invoke(IPC.systemAgentDraft, id),
  setAgentDraft: (id, draft) => ipcRenderer.invoke(IPC.systemSetAgentDraft, id, draft),
  activateAgent: (id, human) => ipcRenderer.invoke(IPC.systemActivateAgent, id, human),
  deactivateAgent: (id) => ipcRenderer.invoke(IPC.systemDeactivateAgent, id),
  draftAgentAuto: (id) => ipcRenderer.invoke(IPC.systemDraftAgentAuto, id)
}
