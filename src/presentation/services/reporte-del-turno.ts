import { reporteDeTarea, textoDelReporte } from '@domain/chat/reporte-de-tarea'
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
 * El carril de vuelta (PASO 89): gemelo EXACTO del Transferir — PRECARGA el
 * input de la vista del CTO con el reporte COMPLETO (cabecera + resumen entero,
 * ya tachado) y salta a ella. Asi el reporte entra como MENSAJE enviable a la
 * conversacion, no como adorno. Sin reporte NO navega ni toca el input.
 */
export function reportarAlChat(projectId: string): void {
  const reporte = useChatStore.getState().reporteByProject[projectId]
  if (reporte === undefined) return
  useConstruirStore.getState().setInput(textoDelReporte(reporte))
  useUiStore.getState().setView('construir')
}
