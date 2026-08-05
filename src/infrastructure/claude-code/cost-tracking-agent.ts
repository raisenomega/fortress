import type { CodeAgent } from '@domain/chat/code-agent'

/**
 * Envuelve un CodeAgent para reportar el coste REAL de cada corrida (del propio
 * CLI) a un acumulador. Asi el bucle de genesis corta en el tope con gasto real,
 * no estimado. No cambia el comportamiento del agente: solo observa el coste.
 */
export function costTrackingAgent(agent: CodeAgent, onCost: (usd: number) => void): CodeAgent {
  return {
    isAvailable: agent.isAvailable,
    precheck: agent.precheck,
    run: async (request, onChunk) => {
      const reply = await agent.run(request, onChunk)
      onCost(reply.usage.costUsd)
      return reply
    }
  }
}
