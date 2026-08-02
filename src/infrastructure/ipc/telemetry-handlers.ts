import { ipcMain } from 'electron'
import { nowIso } from '@domain/shared/id'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

/**
 * "Esta sesion" es desde que arranco la app. Se sella al registrar el handler,
 * antes de que nada pueda ejecutarse, para que ninguna ejecucion quede fuera
 * de la cuenta que se le ensena al operador.
 */
const SESSION_START = nowIso()

export function registerTelemetryHandlers(): void {
  ipcMain.handle(IPC.telemetrySession, () => getAppContext().runs.usageSince(SESSION_START))

  ipcMain.handle(IPC.telemetrySince, (_event, since: string) =>
    getAppContext().runs.usageSince(since)
  )

  ipcMain.handle(IPC.telemetryByProject, (_event, since: string) =>
    getAppContext().runs.usageByProjectSince(since)
  )

  ipcMain.handle(IPC.telemetryRanking, (_event, since: string, limit: number) =>
    getAppContext().runs.rankingSince(since, limit)
  )
}
