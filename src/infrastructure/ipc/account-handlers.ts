import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { readAccount, startLogin } from '../claude-code/claude-account'
import { IPC } from './channels'

function sender(event: IpcMainInvokeEvent) {
  return (text: string): void => {
    if (!event.sender.isDestroyed()) event.sender.send(IPC.accountLoginOutput, text)
  }
}

export function registerAccountHandlers(): void {
  ipcMain.handle(IPC.accountStatus, () => readAccount())

  ipcMain.handle(IPC.accountLogin, (event) => {
    startLogin(sender(event))
  })
}
