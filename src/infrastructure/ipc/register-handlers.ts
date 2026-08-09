import { registerAccountHandlers } from './account-handlers'
import { registerBuildHandlers } from './build-handlers'
import { registerPostureHandlers } from './posture-handlers'
import { registerActivityHandlers } from './activity-handlers'
import { registerChatHandlers } from './chat-handlers'
import { registerCognitionHandlers } from './cognition-handlers'
import { registerConnectorHandlers } from './connector-handlers'
import { registerChatSendHandler } from './chat-send-handler'
import { registerGraphHandlers } from './graph-handlers'
import { registerGraphActionHandlers } from './graph-action-handlers'
import { registerHealthHandlers } from './health-handlers'
import { registerMaintenanceHandlers } from './maintenance-handlers'
import { registerNewProjectHandlers } from './newproject-handlers'
import { registerOmegaHandlers } from './omega-handlers'
import { registerProjectHandlers } from './project-handlers'
import { registerPushHandlers } from './push-handlers'
import { registerRepairHandlers } from './repair-handlers'
import { registerScanHandlers } from './scan-handlers'
import { registerQualityHandlers } from './quality-handlers'
import { registerSettingsHandlers } from './settings-handlers'
import { registerSystemHandlers } from './system-handlers'
import { registerTelemetryHandlers } from './telemetry-handlers'

/** Punto unico de registro IPC, invocado desde el composition root. */
export function registerIpcHandlers(): void {
  registerProjectHandlers()
  registerChatHandlers()
  registerChatSendHandler()
  registerSettingsHandlers()
  registerHealthHandlers()
  registerScanHandlers()
  registerRepairHandlers()
  registerQualityHandlers()
  registerPushHandlers()
  registerActivityHandlers()
  registerTelemetryHandlers()
  registerCognitionHandlers()
  registerGraphHandlers()
  registerGraphActionHandlers()
  registerMaintenanceHandlers()
  registerNewProjectHandlers()
  registerAccountHandlers()
  registerPostureHandlers()
  registerConnectorHandlers()
  registerOmegaHandlers()
  registerSystemHandlers()
  registerBuildHandlers()
}
