import { ipcMain } from 'electron'
import { NOT_INSTALLED } from '@domain/graph/graph-status'
import { detectGraph } from '../graph/detect-graph'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

export function registerGraphHandlers(): void {
  ipcMain.handle(IPC.graphStatus, (_event, projectId: string) => {
    const project = getAppContext().projects.findById(projectId)
    return project ? detectGraph(project.path) : NOT_INSTALLED
  })
}
