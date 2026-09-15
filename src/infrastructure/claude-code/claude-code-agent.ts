import { spawn } from 'child_process'
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
import { precheckProjectPath } from './precheck-project-path'
import { collectRun, TECHO_POR_DEFECTO } from './run-claude-process'

/**
 * Ejecuta Claude Code dentro de la carpeta del proyecto. A diferencia del chat
 * por API, este agente tiene acceso real: filesystem, bash, git, npm.
 *
 * El proyecto se fija con el cwd del proceso: el CLI no tiene flag --project.
 *
 * La memoria por hallazgo (ADR-088, Enmienda 2) se pone AQUI, tras `buildArgs` y
 * nunca dentro: claude-cli.ts es innegociable. `--fork-session` reanuda en una
 * sesion DERIVADA, asi la guardada solo cambia si el turno merece recordarse.
 */
export function createClaudeCodeAgent(
  apiKeys: ApiKeyStore,
  budget: Budget,
  useApiKey: boolean,
  /** JSON de los conectores MCP activos, o null. Default null: sin conectores
   *  los argumentos salen identicos a como salian antes de existir esto. */
  mcpConfig: string | null = null,
  /** Agentes auto-propuestos ACTIVOS a inyectar. Default vacio: sin cambios. */
  customAgents: Readonly<Record<string, AgentDefinition>> = {},
  /**
   * Cuanto se espera antes de dar el proceso por colgado. `SIN_TECHO` para el
   * escaneo (ADR-082, Enmienda 3) y para el Terminal (ADR-088; ADR-082,
   * Enmienda 4); quien no pasa nada conserva los 15 minutos.
   */
  techoMs: number = TECHO_POR_DEFECTO
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
      if (request.reanudarSesion) args.push('--resume', request.reanudarSesion, '--fork-session')

      const child = spawn(CLAUDE_BIN, args, {
        cwd: request.projectPath,
        // Solo se pasa la key si el operador eligio facturar a la key. Sin
        // ella, `claude` usa su propia sesion y consume del plan.
        env: buildEnv(useApiKey ? apiKeys.read() : null)
      })
      trackChild(child, request.projectId ?? null)

      return collectRun(child, onChunk, techoMs)
    }
  }
}
