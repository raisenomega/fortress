import { ipcMain } from 'electron'
import { runHealthCheck } from '../diagnostics/run-health-check'
import { getAppContext } from '../persistence/app-context'
import { selfProject } from '../system/self-project'
import { IPC } from './channels'

export function registerHealthHandlers(): void {
  ipcMain.handle(IPC.healthRun, () => runHealthCheck(getAppContext()))

  ipcMain.handle(IPC.projectsSelf, () => selfProject())
}
