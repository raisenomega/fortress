import type { SendMessageOutput } from '@application/chat/send-message-types'
import { autoReporteDelTerminal } from './auto-reporte-del-terminal'
import { captureConfigDrafts } from './capture-config-drafts'
import { asentarReporte } from './reporte-del-turno'

/** Lo que pasa tras un turno OK del Terminal, en un solo sitio: capturar los
 *  borradores de configuracion (del texto PERSISTIDO, autoritativo), asentar el
 *  ReporteDeTarea para el carril de vuelta (PASO 87), y —si el lazo autonomo
 *  esta activo— devolver solo ese reporte al CTO (Sello 2b-b). El reporte se
 *  asienta ANTES: la vuelta lo lee del store. */
export function despuesDelTurno(projectId: string, salida: SendMessageOutput): void {
  captureConfigDrafts(projectId, salida.assistant.content)
  asentarReporte(projectId, salida)
  autoReporteDelTerminal(projectId)
}
