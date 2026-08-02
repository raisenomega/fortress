import { ipcMain } from 'electron'
import { pushProject } from '@application/push/push-project'
import { createGitPusher } from '../git/git-push'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

export function registerPushHandlers(): void {
  ipcMain.handle(IPC.pushRun, (_event, projectId: string) =>
    pushProject(getAppContext(), createGitPusher(), projectId)
  )
}
