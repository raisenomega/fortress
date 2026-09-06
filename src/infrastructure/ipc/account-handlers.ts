import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { readAccount, startLogin } from '../claude-code/claude-account'
import { sinSecretosEnVivo } from '@application/chat/en-vivo-tachado'
import { IPC } from './channels'

/** El login imprime lo que el CLI diga, y ese proceso corre con la sesion viva
 *  del operador a proposito. Lo que salga a la pantalla va tachado igual. */
function sender(event: IpcMainInvokeEvent): (text: string) => void {
  return sinSecretosEnVivo((text: string): void => {
    if (!event.sender.isDestroyed()) event.sender.send(IPC.accountLoginOutput, text)
  })
}

export function registerAccountHandlers(): void {
  ipcMain.handle(IPC.accountStatus, () => readAccount())

  ipcMain.handle(IPC.accountLogin, (event) => startLogin(sender(event)))
}
