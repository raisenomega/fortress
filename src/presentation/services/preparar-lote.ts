import { textoDelPlan } from '@domain/chat/lote-del-terminal'
import { useColaDelLoteStore } from '../stores/cola-del-lote-store'
import { useLoteStore } from '../stores/lote-store'
import { useSettingsStore } from '../stores/settings-store'
import { useUiStore } from '../stores/ui-store'
import { useWorkflowStore } from '../stores/workflow-store'

/**
 * Pulsar «Resolver lote en Terminal» (ADR-088, arco 1): NO envia nada. Deja el
 * mensaje escrito en el Terminal y se aparta. Lo manda el operador con su Enter,
 * y ese Enter es toda la aprobacion que hace falta.
 *
 * El borrador se REEMPLAZA, asi que el residuo de «Preguntar al Terminal» se va
 * con el; y un mensaje que esperaba Aprobar se descarta, como en «Resolver en
 * Terminal»: era de otra peticion.
 *
 * En autonomo no precarga y NO avisa aqui: la barra ya lo dice antes de pulsar,
 * y repetirlo en un toast por cada clic solo molesta.
 */
export function prepararLote(projectId: string, projectName: string): void {
  const ids = [...(useLoteStore.getState().seleccion[projectId] ?? [])]
  if (ids.length === 0) return
  if (useSettingsStore.getState().mode === 'autonomo') return
  const flujo = useWorkflowStore.getState()
  flujo.setPending(null)
  flujo.setDraft(textoDelPlan(projectName, ids.length))
  useColaDelLoteStore.getState().preparar(projectId, ids)
  useUiStore.getState().setView('chat')
}
