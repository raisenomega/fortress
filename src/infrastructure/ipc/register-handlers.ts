import { registerChatHandlers } from './chat-handlers'
import { registerProjectHandlers } from './project-handlers'
import { registerSettingsHandlers } from './settings-handlers'

/** Punto unico de registro IPC, invocado desde el composition root. */
export function registerIpcHandlers(): void {
  registerProjectHandlers()
  registerChatHandlers()
  registerSettingsHandlers()
}
