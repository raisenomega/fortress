import { AGENT_CATALOG } from '@domain/agent/agent-catalog'
import { buildAgentsPayload, type AgentDefinition } from '@domain/agent/agent-prompt'
import { projectAgentIds } from '../agents/project-agents'

/**
 * Los agentes de FORTRESS que hay que inyectar en este proyecto: todos menos
 * los que el proyecto ya define por su cuenta en .claude/agents. Si el
 * operador escribio su propio `security-reviewer`, gana el suyo.
 */
export function agentsForProject(projectPath: string): Readonly<Record<string, AgentDefinition>> {
  const propios = projectAgentIds(projectPath)
  return buildAgentsPayload(AGENT_CATALOG.filter((agent) => !propios.has(agent.id)))
}
