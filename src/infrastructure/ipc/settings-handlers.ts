import { ipcMain } from 'electron'
import { checkStoredApiKey, saveApiKey } from '@application/settings/save-api-key'
import { isPublicSettingKey } from '@domain/settings/settings-repository'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

export function registerSettingsHandlers(): void {
  // Lista blanca en los dos sentidos: sin ella el renderer podia leer la
  // API key cifrada y sobrescribirla con settings:set.
  ipcMain.handle(IPC.settingsGet, (_event, key: string) =>
    isPublicSettingKey(key) ? getAppContext().settings.get(key) : null
  )

  ipcMain.handle(IPC.settingsSet, (_event, key: string, value: string) => {
    if (!isPublicSettingKey(key)) return
    getAppContext().settings.set(key, value)
  })

  // La key entra cifrada y nunca vuelve a salir: el renderer solo puede
  // preguntar si existe o pedir que se revalide.
  ipcMain.handle(IPC.settingsSaveApiKey, (_event, plainKey: string) =>
    saveApiKey(getAppContext(), plainKey)
  )

  ipcMain.handle(IPC.settingsHasApiKey, () => getAppContext().apiKeys.has())

  ipcMain.handle(IPC.settingsCheckApiKey, () => checkStoredApiKey(getAppContext()))

  ipcMain.handle(IPC.settingsClearApiKey, () => {
    getAppContext().apiKeys.clear()
  })
}
