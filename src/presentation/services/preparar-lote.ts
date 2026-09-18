import { textoDelPlan } from '@domain/chat/lote-del-terminal'
import { useColaDelLoteStore } from '../stores/cola-del-lote-store'
import { useLoteStore } from '../stores/lote-store'
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
 * Precarga en LOS DOS modos (ADR-090, Fase A.1c). Antes se cortaba en autonomo
 * porque el lote no tenia quien juzgara lo que dejaba escrito; ahora lo juzga
 * OMEGA turno a turno, asi que el modo decide como se ejecuta, no si se puede.
 */
export function prepararLote(projectId: string, projectName: string): void {
  const ids = [...(useLoteStore.getState().seleccion[projectId] ?? [])]
  if (ids.length === 0) return
  const flujo = useWorkflowStore.getState()
  flujo.setPending(null)
  flujo.setDraft(textoDelPlan(projectName, ids.length))
  useColaDelLoteStore.getState().preparar(projectId, ids)
  useUiStore.getState().setView('chat')
}
