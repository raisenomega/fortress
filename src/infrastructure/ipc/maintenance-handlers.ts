import { BrowserWindow, ipcMain, session } from 'electron'
import { killAllChildren, liveChildCount } from '../claude-code/child-registry'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import { getAppContext } from '../persistence/app-context'
import { releaseKeepAwake, requestKeepAwake } from '../system/keep-awake'
import { IPC } from './channels'

export interface CleanupReport {
  /** Procesos `claude` terminados. */
  readonly killed: number
}

/**
 * Reinicio en caliente: termina los procesos que quedaron corriendo, vacia la
 * cache del navegador y recarga el renderer. Sustituye a cerrar y volver a
 * abrir la app, que era la unica forma de soltar un escaneo colgado.
 *
 * La base de datos NO se toca: los datos son el activo, no la basura.
 */
export function registerMaintenanceHandlers(): void {
  ipcMain.handle(IPC.maintenanceLiveJobs, () => liveChildCount())

  // Lo que pide el operador se aplica y se RECUERDA: su eleccion sobrevive al
  // reinicio, que es cuando mas falta hace (un ejercicio largo empieza ahi).
  ipcMain.handle(IPC.maintenanceKeepAwake, (_event, enable: boolean) => {
    if (enable) requestKeepAwake('operator')
    else releaseKeepAwake('operator')
    getAppContext().settings.set(SETTINGS_KEYS.keepAwake, enable ? 'true' : 'false')
  })

  ipcMain.handle(IPC.maintenanceCleanup, async (event): Promise<CleanupReport> => {
    const killed = killAllChildren()
    await session.defaultSession.clearCache()

    const window = BrowserWindow.fromWebContents(event.sender)
    // Se recarga en el siguiente tick para que el renderer llegue a recibir
    // la respuesta y pueda contar lo que se limpio.
    setTimeout(() => window?.webContents.reloadIgnoringCache(), 1200)

    return { killed }
  })
}
