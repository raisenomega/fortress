import { reporteDeTarea } from '@domain/chat/reporte-de-tarea'
import type { SendMessageOutput } from '@application/chat/send-message-types'
import { useChatStore } from '../stores/chat-store'
import { useConstruirStore } from '../stores/construir-store'
import { useUiStore } from '../stores/ui-store'

/** Al terminar un turno del Terminal: se empaqueta el ReporteDeTarea y queda
 *  listo en el store para que el badge lo lleve. El constructor es del dominio;
 *  aqui solo se asienta. */
export function asentarReporte(projectId: string, salida: SendMessageOutput): void {
  useChatStore.getState().setReporte(projectId, reporteDeTarea(salida))
}

/**
 * El carril de vuelta (PASO 87): gemelo del Transferir pero CON CARGA — lleva
 * el ReporteDeTarea a la ranura de la vista del CTO y salta a ella. Sin
 * reporte NO navega: un salto vacio seria el copy-paste de siempre, sin dato.
 */
export function reportarAlChat(projectId: string): void {
  const reporte = useChatStore.getState().reporteByProject[projectId]
  if (reporte === undefined) return
  useConstruirStore.getState().setReporteEntrante(reporte)
  useUiStore.getState().setView('construir')
}
