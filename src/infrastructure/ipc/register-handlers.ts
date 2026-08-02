import { registerActivityHandlers } from './activity-handlers'
import { registerChatHandlers } from './chat-handlers'
import { registerChatSendHandler } from './chat-send-handler'
import { registerHealthHandlers } from './health-handlers'
import { registerProjectHandlers } from './project-handlers'
import { registerPushHandlers } from './push-handlers'
import { registerScanHandlers } from './scan-handlers'
import { registerSettingsHandlers } from './settings-handlers'
import { registerTelemetryHandlers } from './telemetry-handlers'

/** Punto unico de registro IPC, invocado desde el composition root. */
export function registerIpcHandlers(): void {
  registerProjectHandlers()
  registerChatHandlers()
  registerChatSendHandler()
  registerSettingsHandlers()
  registerHealthHandlers()
  registerScanHandlers()
  registerPushHandlers()
  registerActivityHandlers()
  registerTelemetryHandlers()
}
