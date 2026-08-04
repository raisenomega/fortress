import type { AgentHealth } from './agent-health'

/**
 * Percentil de confiabilidad de un agente DENTRO de este sistema (no un baseline
 * inventado): que fraccion de los agentes con datos queda en su nivel o por
 * debajo. Null si el agente no tiene datos. Honesto y relativo a la flota real.
 */
export function compliancePercentile(
  agents: readonly AgentHealth[],
  agentId: string
): number | null {
  const conDatos = agents.filter((a) => a.compliance !== null)
  const yo = conDatos.find((a) => a.agentId === agentId)
  if (!yo || yo.compliance === null || conDatos.length === 0) return null

  const nivel = yo.compliance
  const enODebajo = conDatos.filter((a) => (a.compliance ?? 0) <= nivel).length
  return Math.round((100 * enODebajo) / conDatos.length)
}
