import type { AgentId } from '@domain/agent/agent'
import type { OperationMode } from '@domain/settings/operation-mode'
import { aprobar, cancelar, enviar } from '../services/puerta-del-envio'
import { useActiveProject } from '../stores/project-store'
import { useWorkflowStore } from '../stores/workflow-store'

export interface WorkflowGate {
  readonly pendingPrompt: string | null
  send: (prompt: string) => void
  approve: () => void
  cancel: () => void
}

/**
 * La puerta entre escribir y ejecutar. En supervisado el mensaje se queda
 * esperando aprobacion del plan; en autonomo sale directo. Vive en un hook
 * porque son cuatro piezas de estado que van siempre juntas.
 *
 * La logica esta en `puerta-del-envio`, sin React, para poder probarla: aqui
 * queda lo que si es de un hook —el pendiente reactivo y el proyecto activo—.
 */
export function useWorkflowGate(
  projectId: string | null,
  mode: OperationMode,
  excludedAgents: readonly AgentId[]
): WorkflowGate {
  const pendingPrompt = useWorkflowStore((state) => state.pendingPrompt)
  // Un proyecto sin marco aprobado no usa la plan-card: sus mensajes van directos
  // a la entrevista de configuracion, con o sin modo supervisado.
  const configuring = useActiveProject()?.configState === 'PENDIENTE_CONFIGURACION'
  const envio = { projectId, mode, excludedAgents }

  return {
    // En configuracion no hay plan-card: oculta un pendingPrompt residual de otro
    // proyecto para que Aprobar no inyecte ese prompt viejo en la entrevista.
    pendingPrompt: configuring ? null : pendingPrompt,
    send: (prompt) => enviar(envio, prompt, configuring),
    approve: () => aprobar(envio),
    cancel: cancelar
  }
}
