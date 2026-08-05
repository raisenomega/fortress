import { ipcMain } from 'electron'
import { getAgentDraft, setAgentDraft } from '@application/system/agent-draft-edit'
import { activateAgent, deactivateAgent } from '@application/system/agent-activation'
import type { AgentDraft } from '@domain/system/agent-draft'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

/** IPC de las definiciones de agente auto-propuestas (borrador + activacion). */
export function registerAgentDraftHandlers(): void {
  ipcMain.handle(IPC.systemAgentDraft, (_event, id: string) => getAgentDraft(getAppContext(), id))

  ipcMain.handle(IPC.systemSetAgentDraft, (_event, id: string, draft: AgentDraft) =>
    setAgentDraft(getAppContext(), id, draft)
  )

  ipcMain.handle(IPC.systemActivateAgent, (_event, id: string, humanApproved: boolean) =>
    activateAgent(getAppContext(), id, humanApproved)
  )

  ipcMain.handle(IPC.systemDeactivateAgent, (_event, id: string) =>
    deactivateAgent(getAppContext(), id)
  )
}
