import { ipcMain } from 'electron'
import type { LoopSession } from '@domain/loop/loop-session'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

/**
 * Lo unico que el renderer necesita preguntar del loop: la sesion guardada del
 * proyecto. El estado en vivo se EMPUJA por IPC.loopStatus mientras corre, pero
 * ese empuje muere con la ventana; la razon de por que paro tiene que poder
 * consultarse despues, que es justo cuando el operador la busca.
 */
export function registerLoopHandlers(): void {
  ipcMain.handle(IPC.loopLastSession, (_event, projectId: string): LoopSession | null =>
    getAppContext().loopSessions.get(projectId)
  )
}
