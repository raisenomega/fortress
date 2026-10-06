import { ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { envolverRegistroIpc, exigirOrigenPropio } from './embudo-de-ipc'
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
 * Punto unico de registro IPC: el control de origen y el embudo (ADR-086) se instalan
 * AQUI, antes de los 29, y cubren los 110 sin editar ninguno de los 36 ficheros. El
 * origen va primero para quedar por fuera; su URL es la que carga `loadRenderer`.
 */
export function registerIpcHandlers(): void {
  exigirOrigenPropio(ipcMain, {
    indexHtml: join(__dirname, '../renderer/index.html'),
    devUrl: is.dev ? process.env['ELECTRON_RENDERER_URL'] : undefined
  })
  envolverRegistroIpc(ipcMain, sumideroDeFallos)

  registerProjectHandlers()
  registerChatHandlers()
  registerChatSendHandler()
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
