import { spawn } from 'child_process'
import { existsSync, statSync } from 'fs'
import type { CodeAgent } from '@domain/chat/code-agent'
import type { AgentDefinition } from '@domain/agent/agent-prompt'
import type { ApiKeyStore } from '@domain/settings/api-key-store'
import type { Budget } from '@domain/settings/run-budget'
import { agentsForProject } from './agents-for-project'
import { trackChild } from './child-registry'
import { buildArgs, buildEnv, CLAUDE_BIN, isClaudeInstalled } from './claude-cli'
import { collectRun } from './run-claude-process'

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

    precheck: (projectPath) => {
      try {
        if (statSync(projectPath).isDirectory()) return null
        return `La ruta del proyecto no es una carpeta: ${projectPath}`
      } catch {
        return existsSync(projectPath)
          ? `No se puede acceder a la carpeta del proyecto: ${projectPath}`
          : `La carpeta del proyecto ya no existe: ${projectPath}`
      }
    },

    run: (request, onChunk) => {
      const agents = agentsForProject(request.projectPath, customAgents)
      const args = buildArgs(
        request.prompt,
        request.permissionMode,
        agents,
        request.agentId,
        budget.perRun,
        mcpConfig,
        request.trusted
      )

      const child = spawn(CLAUDE_BIN, args, {
        cwd: request.projectPath,
        // Solo se pasa la key si el operador eligio facturar a la key. Sin
        // ella, `claude` usa su propia sesion y consume del plan.
        env: buildEnv(useApiKey ? apiKeys.read() : null)
      })
      trackChild(child)

      return collectRun(child, onChunk)
    }
  }
}
