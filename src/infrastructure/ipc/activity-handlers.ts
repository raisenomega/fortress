import { ipcMain } from 'electron'
import type { AgentId } from '@domain/agent/agent'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

export function registerActivityHandlers(): void {
  ipcMain.handle(IPC.activityProject, (_event, projectId: string, limit: number) =>
    getAppContext().activity.listByProject(projectId, limit)
  )

  ipcMain.handle(
    IPC.activityAgent,
    (_event, agentId: AgentId, projectId: string | null, limit: number) =>
      getAppContext().activity.listByAgent(agentId, projectId, limit)
  )
}
