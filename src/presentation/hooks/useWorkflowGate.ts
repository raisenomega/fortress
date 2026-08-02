import type { AgentId } from '@domain/agent/agent'
import type { OperationMode } from '@domain/settings/operation-mode'
import { sendMessage } from '../services/chat-service'
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
 */
export function useWorkflowGate(
  projectId: string | null,
  mode: OperationMode,
  excludedAgents: readonly AgentId[]
): WorkflowGate {
  const pendingPrompt = useWorkflowStore((state) => state.pendingPrompt)
  const setPending = useWorkflowStore((state) => state.setPending)

  const run = (prompt: string): void => {
    if (projectId) void sendMessage({ projectId, prompt, mode, excludedAgents })
  }

  return {
    pendingPrompt,
    send: (prompt) => (mode === 'supervisado' ? setPending(prompt) : run(prompt)),
    approve: () => {
      const prompt = pendingPrompt
      setPending(null)
      if (prompt !== null) run(prompt)
    },
    cancel: () => setPending(null)
  }
}
