import { textoDelPlan } from '@domain/chat/lote-del-terminal'
import { useColaDelLoteStore } from '../stores/cola-del-lote-store'
import { useLoteStore } from '../stores/lote-store'
import { useSettingsStore } from '../stores/settings-store'
import { notify } from '../stores/toast-store'
import { useUiStore } from '../stores/ui-store'
import { useWorkflowStore } from '../stores/workflow-store'

export const AVISO_AUTONOMO =
  'En autonomo el plan del lote lo aprueba OMEGA, y OMEGA llega con la pieza 5. ' +
  'Hoy el lote resuelve en supervisado: tu apruebas el plan y la cola ejecuta.'

/**
 * Pulsar «Resolver lote en Terminal» (ADR-088, arco 1): NO envia nada. Precarga
 * en el borrador el mensaje de PLAN y deja el lote esperando aprobacion; el
 * operador lo lee, lo manda cuando quiera y aprueba el plan con su boton.
 *
 * El borrador se REEMPLAZA, asi que el residuo de «Preguntar al Terminal» se va
 * con el; y un mensaje que esperaba Aprobar se descarta, como en «Resolver en
 * Terminal»: era de otra peticion.
 *
 * En autonomo no precarga: avisa. Sin auditor del plan, resolver a ciegas seria
 * justo lo que la pieza 5 viene a impedir.
 */
export function prepararLote(projectId: string, projectName: string): void {
  const ids = [...(useLoteStore.getState().seleccion[projectId] ?? [])]
  if (ids.length === 0) return
  if (useSettingsStore.getState().mode === 'autonomo') {
    notify(AVISO_AUTONOMO)
    return
  }
  const flujo = useWorkflowStore.getState()
  flujo.setPending(null)
  flujo.setDraft(textoDelPlan(projectName, ids.length))
  useColaDelLoteStore.getState().preparar(projectId, ids)
  useUiStore.getState().setView('chat')
}
