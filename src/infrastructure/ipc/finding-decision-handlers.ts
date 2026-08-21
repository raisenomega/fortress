import { ipcMain } from 'electron'
import { dismissFinding, markMitigatedFinding, reopenFinding } from '@application/scan/dismiss-finding' // prettier-ignore
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

/**
 * Lo que el OPERADOR decide sobre un hallazgo, aparte de lo que el escaneo
 * descubre. Son tres y conviene verlas juntas porque se confunden: descartar
 * dice "no era un problema", reabrir deshace eso, y mitigar dice "si lo era y ya
 * esta arreglado". Las dos primeras mueven `status`; la tercera, `lifecycle`.
 */
export function registerFindingDecisionHandlers(): void {
  ipcMain.handle(IPC.scanDismiss, (_event, findingId: string) =>
    dismissFinding(getAppContext(), findingId)
  )

  ipcMain.handle(IPC.scanReopen, (_event, findingId: string) =>
    reopenFinding(getAppContext(), findingId)
  )

  ipcMain.handle(IPC.scanMitigate, (_event, findingId: string, note: string) =>
    markMitigatedFinding(getAppContext(), String(findingId), String(note))
  )
}
