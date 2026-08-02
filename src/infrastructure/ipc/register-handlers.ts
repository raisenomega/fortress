import { registerChatHandlers } from './chat-handlers'
import { registerChatSendHandler } from './chat-send-handler'
import { registerHealthHandlers } from './health-handlers'
import { registerProjectHandlers } from './project-handlers'
import { registerSettingsHandlers } from './settings-handlers'

/** Punto unico de registro IPC, invocado desde el composition root. */
export function registerIpcHandlers(): void {
  registerProjectHandlers()
  registerChatHandlers()
  registerChatSendHandler()
  registerSettingsHandlers()
  registerHealthHandlers()
}
