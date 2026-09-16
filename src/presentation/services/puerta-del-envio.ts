import type { AgentId } from '@domain/agent/agent'
import type { OperationMode } from '@domain/settings/operation-mode'
import { useWorkflowStore } from '../stores/workflow-store'
import { sendMessage } from './chat-service'
import { lotePendienteDe, planDelLote } from './lote-por-enter'

/** A quien y como se envia: lo que el hook sabe del proyecto activo. */
export interface Envio {
  readonly projectId: string | null
  readonly mode: OperationMode
  readonly excludedAgents: readonly AgentId[]
}

/** El findingId del foco, solo si es de ESTE proyecto: un foco ajeno no viaja. */
function focoDe(projectId: string): string | undefined {
  const foco = useWorkflowStore.getState().foco
  return foco !== null && foco.projectId === projectId ? foco.findingId : undefined
}

/**
 * Sale el mensaje. El foco viaja con el y se limpia en el acto: el siguiente
 * mensaje libre no arrastra el hallazgo (ADR-088, pieza 2).
 */
export function ejecutar(envio: Envio, prompt: string): void {
  if (envio.projectId === null) return
  const findingId = focoDe(envio.projectId)
  useWorkflowStore.getState().setFoco(null)
  const { projectId, mode, excludedAgents } = envio
  void sendMessage({
    ...{ projectId, prompt, mode, excludedAgents },
    ...(findingId === undefined ? {} : { findingId })
  })
}

/**
 * En supervisado el mensaje espera aprobacion; en autonomo sale directo. El foco
 * NO se toca al esperar: vive aparte, y sale cuando salga el mensaje.
 *
 * EXCEPCION, el lote (ADR-088, arco 1): con un lote precargado, este Enter manda
 * el turno de PLAN, que corre en solo lectura y PARA. No pasa por la plan-card
 * —seria pedir dos veces lo mismo, y con una estimacion que no es la suya—, y
 * tampoco ejecuta: la cola espera al disparo del operador sobre el plan ya leido.
 */
export function enviar(envio: Envio, prompt: string, configuring: boolean): void {
  if (envio.projectId !== null && lotePendienteDe(envio.projectId)) {
    void planDelLote(envio.projectId, prompt, envio.excludedAgents)
    return
  }
  if (envio.mode === 'supervisado' && !configuring) useWorkflowStore.getState().setPending(prompt)
  else ejecutar(envio, prompt)
}

/** Aprobar el mensaje que esperaba: sale con el foco que tuviera. */
export function aprobar(envio: Envio): void {
  const { pendingPrompt, setPending } = useWorkflowStore.getState()
  setPending(null)
  if (pendingPrompt !== null) ejecutar(envio, pendingPrompt)
}

/** Cancelar descarta el mensaje Y su foco: si no, el siguiente mensaje libre
 *  saldria con un hallazgo que el operador ya dejo de pedir. */
export function cancelar(): void {
  useWorkflowStore.getState().setPending(null)
  useWorkflowStore.getState().setFoco(null)
}
