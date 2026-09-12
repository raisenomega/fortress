import { ipcMain } from 'electron'
import { envolverRegistroIpc } from './embudo-de-ipc'
import { sumideroDeFallos } from '../system/sumidero-de-fallos'
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
import { registerGraphReindexHandlers } from './graph-reindex-handlers'
import { registerHealthHandlers } from './health-handlers'
import { registerLoopHandlers } from './loop-handlers'
import { registerMaintenanceHandlers } from './maintenance-handlers'
import { registerNewProjectHandlers } from './newproject-handlers'
import { registerOmegaHandlers } from './omega-handlers'
import { registerProjectHandlers } from './project-handlers'
import { registerPushHandlers } from './push-handlers'
import { registerRepairGateHandler } from './repair-gate-handler'
import { registerRepairOmegaHandler } from './repair-omega-handler'
import { registerRepairGenerateHandler } from './repair-generate-handler'
import { registerRepairHandlers } from './repair-handlers'
import { registerRepairRetryHandler } from './repair-retry-handler'
import { registerRepairWithdrawHandler } from './repair-withdraw-handler'
import { registerScanHandlers } from './scan-handlers'
import { registerQualityHandlers } from './quality-handlers'
import { registerSettingsHandlers } from './settings-handlers'
import { registerSystemHandlers } from './system-handlers'
import { registerTelemetryHandlers } from './telemetry-handlers'

/**
 * Punto unico de registro IPC, invocado desde el composition root.
 *
 * Y por eso el embudo del Nivel 2 se instala AQUI, antes de los 29: los 110
 * handlers cuelgan de esta llamada, asi que envolver el registro los cubre a
 * todos —incluido `settings-handlers`, que es innegociable— sin editar ninguno
 * de los 36 ficheros, y cubre los que se anadan manana sin que nadie se acuerde
 * (ADR-086, embudo 2).
 */
export function registerIpcHandlers(): void {
  envolverRegistroIpc(ipcMain, sumideroDeFallos)

  registerProjectHandlers()
  registerChatHandlers()
  registerChatSendHandler()
  registerLoopHandlers()
  registerSettingsHandlers()
  registerHealthHandlers()
  registerScanHandlers()
  registerRepairHandlers()
  registerRepairGenerateHandler()
  registerRepairGateHandler()
  registerRepairOmegaHandler()
  registerRepairRetryHandler()
  registerRepairWithdrawHandler()
  registerQualityHandlers()
  registerPushHandlers()
  registerActivityHandlers()
  registerTelemetryHandlers()
  registerCognitionHandlers()
  registerGraphHandlers()
  registerGraphActionHandlers()
  registerGraphReindexHandlers()
  registerMaintenanceHandlers()
  registerNewProjectHandlers()
  registerAccountHandlers()
  registerPostureHandlers()
  registerConnectorHandlers()
  registerOmegaHandlers()
  registerSystemHandlers()
  registerBuildHandlers()
}
