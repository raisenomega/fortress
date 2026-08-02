import type { Agent } from './agent'

/**
 * Reglas comunes a los diez agentes, sacadas de CLAUDE.md. Van en el prompt de
 * cada uno porque el CLI los ejecuta como subagentes independientes: lo que no
 * este aqui, no lo saben.
 */
const RULES = [
  'Reglas que no se negocian:',
  '- Cada hallazgo lleva archivo, linea, severidad, impacto y fix propuesto.',
  '- Evidencia siempre: nada de "podria haber un problema" sin senalar donde.',
  '- Si algo esta bien, dilo. No inventes problemas para justificar el trabajo.',
  '- Nunca toques auth, pagos, RLS ni seguridad sin explicar el impacto antes.',
  '- Un fix pequeno y seguro vale mas que un refactor grande y arriesgado.'
].join('\n')

/**
 * El agente se describe con lo que ya declara el catalogo. No se inventan aqui
 * diez personalidades nuevas: la identidad de cada agente es la que el
 * operador ve en el sidebar, y las dos cosas tienen que coincidir.
 */
export function agentPrompt(agent: Agent): string {
  return [
    `Eres ${agent.name}, agente especializado de FORTRESS.`,
    `Tu responsabilidad: ${agent.purpose}`,
    '',
    RULES
  ].join('\n')
}

export interface AgentDefinition {
  readonly description: string
  readonly prompt: string
}

/** Forma exacta que espera `claude --agents`, verificada contra su --help. */
export function buildAgentsPayload(
  agents: readonly Agent[]
): Readonly<Record<string, AgentDefinition>> {
  const payload: Record<string, AgentDefinition> = {}

  for (const agent of agents) {
    payload[agent.id] = { description: agent.purpose, prompt: agentPrompt(agent) }
  }

  return payload
}
