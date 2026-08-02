import { ipcMain } from 'electron'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC.settingsGet, (_event, key: string) => getAppContext().settings.get(key))

  ipcMain.handle(IPC.settingsSet, (_event, key: string, value: string) => {
    getAppContext().settings.set(key, value)
  })
}
