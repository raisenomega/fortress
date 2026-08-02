import { ipcMain } from 'electron'
import { EMPTY_SNAPSHOT } from '@domain/cognition/cognition-log'
import { readCognitionLog } from '../cognition/read-cognition-log'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

export function registerCognitionHandlers(): void {
  ipcMain.handle(IPC.cognitionRead, (_event, projectId: string) => {
    const project = getAppContext().projects.findById(projectId)
    return project ? readCognitionLog(project.path) : EMPTY_SNAPSHOT
  })
}
