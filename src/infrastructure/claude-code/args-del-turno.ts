import type { AgentDefinition } from '@domain/agent/agent-prompt'
import type { CodeAgentRequest } from '@domain/chat/code-agent'
import { mcpGlobalSegunConfianza, mergeMcpConfig } from '@domain/connectors/mcp-config'
import { err, ok, type Result } from '@domain/shared/result'
import { conSandbox } from '../sandbox/con-sandbox'
import type { ConPrompt } from './prompt-por-stdin'
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
  maxUsd: number,
  /** El directorio del grafo de este turno: el servidor solo alcanza ese store. */
  grafoDir: string | null
): Result<ConPrompt> {
  const agents = agentsForProject(request.projectPath, customAgents)
  // El grafo real (codebase-memory con su graph.db) y demas MCP viven en el
  // .mcp.json del proyecto; solo se pasan si es de confianza (ejecutan comandos).
  const projectMcp = request.trusted ? readProjectMcpServers(request.projectPath) : null
  const lanzamiento = buildArgs(
    request.prompt,
    request.permissionMode,
    agents,
    request.agentId,
    maxUsd,
    // FRONTERA 137: los conectores globales tambien se gatean por confianza.
    mergeMcpConfig(mcpGlobalSegunConfianza(mcpConfig, request.trusted), projectMcp),
    request.trusted,
    readProjectScripts(request.projectPath),
    grafoDir,
    request.disallow ?? []
  )
  // Sin agente, el turno declara SU modelo o no se lanza: heredar el del CLI es
  // loteria (Fable una noche, Opus a otra hora — ADR-078, enmienda del 05-oct).
  if (request.agentId === null && request.model === undefined) return err('sin-modelo-declarado: turno sin agente y sin modelo') // prettier-ignore
  const args = [...lanzamiento.args, ...(request.agentId === null ? ['--model', request.model as string] : [])] // prettier-ignore
  if (request.reanudarSesion) args.push('--resume', request.reanudarSesion, '--fork-session')
  const caja = conSandbox(args, request.projectPath)
  return caja.ok ? ok({ args: caja.value, prompt: lanzamiento.prompt }) : caja
}
