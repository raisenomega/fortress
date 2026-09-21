import type { AgentDefinition } from '@domain/agent/agent-prompt'
import type { CodeAgentRequest } from '@domain/chat/code-agent'
import { mergeMcpConfig } from '@domain/connectors/mcp-config'
import type { Result } from '@domain/shared/result'
import { conSandbox } from '../sandbox/con-sandbox'
import { agentsForProject } from './agents-for-project'
import { buildArgs } from './claude-cli'
import { readProjectMcpServers } from './project-mcp'
import { readProjectScripts } from './project-scripts'

/**
 * Los args de UN turno del Terminal, del escaner o del chat: lo de siempre
 * (`buildArgs`), la sesion a reanudar si la hay, y la caja del CLI encima
 * (ADR-092, clase A). Un `Result` fallido es «no se lanza», nunca «se lanza
 * sin caja».
 */
export function argsDelTurno(
  request: CodeAgentRequest,
  customAgents: Readonly<Record<string, AgentDefinition>>,
  mcpConfig: string | null,
  maxUsd: number
): Result<readonly string[]> {
  const agents = agentsForProject(request.projectPath, customAgents)
  // El grafo real (codebase-memory con su graph.db) y demas MCP viven en el
  // .mcp.json del proyecto; solo se pasan si es de confianza (ejecutan comandos).
  const projectMcp = request.trusted ? readProjectMcpServers(request.projectPath) : null
  const args = buildArgs(
    request.prompt,
    request.permissionMode,
    agents,
    request.agentId,
    maxUsd,
    mergeMcpConfig(mcpConfig, projectMcp),
    request.trusted,
    readProjectScripts(request.projectPath)
  )
  if (request.reanudarSesion) args.push('--resume', request.reanudarSesion, '--fork-session')
  return conSandbox(args, request.projectPath)
}
