import { spawn } from 'child_process'
import type { CodeAgent } from '@domain/chat/code-agent'
import type { AgentDefinition } from '@domain/agent/agent-prompt'
import type { ApiKeyStore } from '@domain/settings/api-key-store'
import type { Budget } from '@domain/settings/run-budget'
import { trackChild } from './child-registry'
import { buildEnv } from './build-env'
import { argsDelTurno } from './args-del-turno'
import { CLAUDE_BIN, isClaudeInstalled } from './claude-cli'
import { precheckProjectPath } from './precheck-project-path'
import { collectRun, TECHO_POR_DEFECTO, sinLanzar } from './run-claude-process'

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
      // La caja del CLI (ADR-092, clase A). Sin caja NO hay turno: se contesta
      // como un CLI que no arranca, con el motivo, y nada se lanza.
      const args = argsDelTurno(request, customAgents, mcpConfig, budget.perRun)
      if (!args.ok) return Promise.resolve(sinLanzar(args.error, onChunk))

      const child = spawn(CLAUDE_BIN, [...args.value], {
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
