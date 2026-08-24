import { ipcMain } from 'electron'
import { nowIso } from '@domain/shared/id'
import { usesApiKey } from '@application/settings/read-auth-source'
import { detectBilling } from '../claude-code/detect-billing'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

/**
 * "Esta sesion" es desde que arranco la app. Se sella al registrar el handler,
 * antes de que nada pueda ejecutarse, para que ninguna ejecucion quede fuera
 * de la cuenta que se le ensena al operador.
 */
const SESSION_START = nowIso()

export function registerTelemetryHandlers(): void {
  ipcMain.handle(IPC.telemetryBilling, () => detectBilling(usesApiKey(getAppContext())))

  ipcMain.handle(IPC.telemetryAverage, (_event, projectId: string) =>
    getAppContext().runs.averageRun(projectId)
  )

  ipcMain.handle(IPC.telemetrySession, () => getAppContext().runs.usageSince(SESSION_START))

  ipcMain.handle(IPC.telemetrySince, (_event, since: string) =>
    getAppContext().runs.usageSince(since)
  )

  ipcMain.handle(IPC.telemetryByProject, (_event, since: string) =>
    getAppContext().runs.usageByProjectSince(since)
  )

  // Lo que el total NO cuenta. Va por su propio canal y no dentro del consumo:
  // mezclarlas invitaria a sumarlas, y el punto es justamente que no se suman.
  ipcMain.handle(IPC.telemetrySinFactura, (_event, since: string) =>
    getAppContext().runs.sinFacturaSince(since === '' ? SESSION_START : since)
  )

  ipcMain.handle(IPC.telemetryRanking, (_event, since: string, limit: number) =>
    getAppContext().runs.rankingSince(since, limit)
  )
}
