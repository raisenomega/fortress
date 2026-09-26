import type { CodeAgent, CodeAgentRequest } from '@domain/chat/code-agent'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'

/**
 * Un agente de mentira que GUARDA cada peticion. Lo que estos tests miran es la
 * peticion tal cual salio hacia el CLI —su `permissionMode`—, no la respuesta.
 */
export function agenteQueRecuerda(text = ''): {
  readonly agent: CodeAgent
  readonly pedidos: CodeAgentRequest[]
} {
  const pedidos: CodeAgentRequest[] = []
  const agent: CodeAgent = {
    isAvailable: () => true,
    precheck: () => null,
    run: (p) => (pedidos.push(p), Promise.resolve({ text, failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] })) // prettier-ignore
  }
  return { agent, pedidos }
}
