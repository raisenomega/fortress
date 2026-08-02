import { ipcMain } from 'electron'
import { appendMessage, clearHistory, getHistory } from '@application/chat/chat-history'
import type { NewChatMessage } from '@domain/chat/chat-message'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

export function registerChatHandlers(): void {
  ipcMain.handle(IPC.chatHistory, (_event, projectId: string) =>
    getHistory(getAppContext(), projectId)
  )

  ipcMain.handle(IPC.chatAppend, (_event, message: NewChatMessage) =>
    appendMessage(getAppContext(), message)
  )

  ipcMain.handle(IPC.chatClear, (_event, projectId: string) => {
    clearHistory(getAppContext(), projectId)
  })
}
