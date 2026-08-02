import { ipcMain } from 'electron'
import { clearApiKey, hasApiKey, saveApiKey } from '../security/api-key-store'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC.settingsGet, (_event, key: string) => getAppContext().settings.get(key))

  ipcMain.handle(IPC.settingsSet, (_event, key: string, value: string) => {
    getAppContext().settings.set(key, value)
  })

  // La key entra cifrada y nunca vuelve a salir: el renderer solo puede
  // preguntar si existe.
  ipcMain.handle(IPC.settingsSaveApiKey, (_event, plainKey: string) =>
    saveApiKey(getAppContext().settings, plainKey)
  )

  ipcMain.handle(IPC.settingsHasApiKey, () => hasApiKey(getAppContext().settings))

  ipcMain.handle(IPC.settingsClearApiKey, () => {
    clearApiKey(getAppContext().settings)
  })
}
