import type { AppContext } from '@application/context'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import type { CodeAgent } from '@domain/chat/code-agent'
import type { Project } from '@domain/project/project'
import { buildMcpConfig } from '@domain/connectors/mcp-config'
import { err, ok, type Result } from '@domain/shared/result'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { isFortressRepo } from '../system/self-project'

export function agentFor(context: AppContext): CodeAgent {
  const cfg = buildMcpConfig(context.connectors.list())
  return createClaudeCodeAgent(context.apiKeys, readBudget(context), usesApiKey(context), cfg)
}

/** Resuelve el proyecto objetivo y BLINDA el repo de FORTRESS: nunca se construye
 *  ni edita sobre la propia app (el agente pisaria su codigo vivo mientras corre). */
export function resolveTarget(context: AppContext, projectId: string): Result<Project> {
  const project = context.projects.findById(projectId)
  if (!project) return err('El proyecto ya no existe')
  if (isFortressRepo(project.path)) {
    return err('No se puede construir sobre el propio repo de FORTRESS')
  }
  return ok(project)
}
