import { spawn } from 'child_process'
import { existsSync, statSync } from 'fs'
import type { CodeAgent } from '@domain/chat/code-agent'
import type { AgentDefinition } from '@domain/agent/agent-prompt'
import type { ApiKeyStore } from '@domain/settings/api-key-store'
import type { Budget } from '@domain/settings/run-budget'
import { mergeMcpConfig } from '@domain/connectors/mcp-config'
import { agentsForProject } from './agents-for-project'
import { trackChild } from './child-registry'
import { buildEnv } from './build-env'
import { buildArgs, CLAUDE_BIN, isClaudeInstalled } from './claude-cli'
import { readProjectMcpServers } from './project-mcp'
import { readProjectScripts } from './project-scripts'
import { collectRun } from './run-claude-process'

/** La carpeta del proyecto tiene que existir y ser una carpeta antes de spawnear. */
function precheckProjectPath(projectPath: string): string | null {
  try {
    if (statSync(projectPath).isDirectory()) return null
    return `La ruta del proyecto no es una carpeta: ${projectPath}`
  } catch {
    return existsSync(projectPath)
      ? `No se puede acceder a la carpeta del proyecto: ${projectPath}`
      : `La carpeta del proyecto ya no existe: ${projectPath}`
  }
}

/**
 * Ejecuta Claude Code dentro de la carpeta del proyecto. A diferencia del chat
 * por API, este agente tiene acceso real: filesystem, bash, git, npm.
 *
 * El proyecto se fija con el cwd del proceso: el CLI no tiene flag --project.
 */
export function createClaudeCodeAgent(
  apiKeys: ApiKeyStore,
  budget: Budget,
  useApiKey: boolean,
  /** JSON de los conectores MCP activos, o null. Default null: sin conectores
   *  los argumentos salen identicos a como salian antes de existir esto. */
  mcpConfig: string | null = null,
  /** Agentes auto-propuestos ACTIVOS a inyectar. Default vacio: sin cambios. */
  customAgents: Readonly<Record<string, AgentDefinition>> = {}
): CodeAgent {
  return {
    isAvailable: isClaudeInstalled,
    precheck: precheckProjectPath,

    run: (request, onChunk) => {
      const agents = agentsForProject(request.projectPath, customAgents)
      // El grafo real (codebase-memory con su graph.db) y demas MCP viven en el
      // .mcp.json del proyecto; solo se pasan si es de confianza (ejecutan comandos).
      const projectMcp = request.trusted ? readProjectMcpServers(request.projectPath) : null
      const args = buildArgs(
        request.prompt,
        request.permissionMode,
        agents,
        request.agentId,
        budget.perRun,
        mergeMcpConfig(mcpConfig, projectMcp),
        request.trusted,
        readProjectScripts(request.projectPath)
      )

      const child = spawn(CLAUDE_BIN, args, {
        cwd: request.projectPath,
        // Solo se pasa la key si el operador eligio facturar a la key. Sin
        // ella, `claude` usa su propia sesion y consume del plan.
        env: buildEnv(useApiKey ? apiKeys.read() : null)
      })
      trackChild(child, request.projectId ?? null)

      return collectRun(child, onChunk)
    }
  }
}
