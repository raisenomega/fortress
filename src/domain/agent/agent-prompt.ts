import type { CorpusDescriptor } from '../project/corpus-descriptor'
import { categoryForAgent } from '../settings/docs-first'
import { buildDocsFirst } from '../settings/docs-first-compose'
import type { Agent } from './agent'

/**
 * Reglas comunes a los agentes de auditoria (Sentinel Omega + 10). Fuente
 * publica: docs/PRINCIPLES.md. Van copiadas en el prompt de cada uno porque el
 * CLI los ejecuta como subagentes independientes: lo que no este aqui, no lo
 * saben. La referencia a docs/ que se anade abajo les dice donde esta el resto.
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
export function agentPrompt(agent: Agent, corpus: CorpusDescriptor): string {
  // OMEGA (y solo agentes con carta propia) llevan una identidad que las reglas
  // comunes no capturan; el resto deriva su prompt de name + purpose.
  const cabecera =
    agent.charter ??
    [
      `Eres ${agent.name}, agente especializado de FORTRESS, con el criterio de un`,
      `ingeniero/CTO senior de 20 anos: profundidad y estandar de produccion`,
      `enterprise, sin superficialidad.`,
      `Tu responsabilidad: ${agent.purpose}`
    ].join('\n')

  const docs = buildDocsFirst(categoryForAgent(agent.id), corpus)
  return [cabecera, '', RULES, ...(docs === '' ? [] : ['', docs])].join('\n')
}

export interface AgentDefinition {
  readonly description: string
  readonly prompt: string
  /** Solo si el agente lo declara. Ausente = el CLI usa el de la sesion. */
  readonly model?: string
}

/** Forma exacta que espera `claude --agents`, verificada contra su --help. */
export function buildAgentsPayload(
  agents: readonly Agent[],
  corpus: CorpusDescriptor
): Readonly<Record<string, AgentDefinition>> {
  const payload: Record<string, AgentDefinition> = {}

  for (const agent of agents) {
    // La llave se OMITE cuando no hay modelo, en vez de mandarla en undefined:
    // `JSON.stringify` la borraria igual, pero el objeto que viaja por el codigo
    // hasta ahi diria que el campo existe y vale nada, que no es lo mismo que
    // "este agente no elige modelo". Y la cadena VACIA se omite tambien: es un
    // descuido, no una eleccion, y mandaria al CLI a pedir un modelo sin nombre.
    payload[agent.id] = {
      description: agent.purpose,
      prompt: agentPrompt(agent, corpus),
      ...(agent.model ? { model: agent.model } : {})
    }
  }

  return payload
}
