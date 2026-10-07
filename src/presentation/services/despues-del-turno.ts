import type { SendMessageOutput } from '@application/chat/send-message-types'
import { captureConfigDrafts } from './capture-config-drafts'
import { asentarReporte } from './reporte-del-turno'

/** Lo que pasa tras un turno OK del Terminal, en un solo sitio: capturar los
 *  borradores de configuracion (del texto PERSISTIDO, autoritativo) y asentar
 *  el ReporteDeTarea para el carril de vuelta (PASO 87). */
export function despuesDelTurno(projectId: string, salida: SendMessageOutput): void {
  captureConfigDrafts(projectId, salida.assistant.content)
  asentarReporte(projectId, salida)
}
