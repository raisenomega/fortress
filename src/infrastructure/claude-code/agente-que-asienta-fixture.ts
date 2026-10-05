import type { AppContext } from '@application/context'
import type { CodeAgent, CodeAgentReply } from '@domain/chat/code-agent'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { NewAgentRun } from '@domain/telemetry/agent-run'

/** Una respuesta con factura de verdad: es lo que el decorador tiene que asentar. */
export const RESPUESTA: CodeAgentReply = {
  text: 'listo',
  failed: false,
  denials: [],
  usage: { ...EMPTY_USAGE, costUsd: 2.5, numTurns: 9, outputTokens: 400 },
  tools: ['Read'],
  edits: []
}

/** El agente de debajo. `tarda` existe para que la duracion no pueda salir en cero. */
export const agenteBase = (tarda = 0): CodeAgent => ({
  isAvailable: () => true,
  precheck: () => null,
  run: async () => {
    if (tarda > 0) await new Promise((r) => setTimeout(r, tarda))
    return RESPUESTA
  }
})

export const PETICION = {
  projectPath: '/tmp/p',
  projectId: 'p1',
  prompt: '?',
  permissionMode: 'plan' as const,
  agentId: null, model: 'sonnet' as const,
  trusted: false
}

/** Un contexto que solo sabe apuntar lo que le asientan. */
export const contextoQueApunta = (asentadas: NewAgentRun[]): AppContext =>
  ({ runs: { record: (r: NewAgentRun) => asentadas.push(r) } }) as unknown as AppContext
