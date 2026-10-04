import { spawn } from 'child_process'
import type { CodeAgent } from '@domain/chat/code-agent'
import type { AgentDefinition } from '@domain/agent/agent-prompt'
import type { ApiKeyStore } from '@domain/settings/api-key-store'
import type { Budget } from '@domain/settings/run-budget'
import { killChildrenOf, trackChild } from './child-registry'
import { isCancelled } from '../run-control'
import { buildEnv } from './build-env'
import { escribirPrompt } from './prompt-por-stdin'
import { argsDelTurno } from './args-del-turno'
import { CLAUDE_BIN, isClaudeInstalled } from './claude-cli'
import { precheckProjectPath } from './precheck-project-path'
import { collectRun, TECHO_POR_DEFECTO, sinLanzar } from './run-claude-process'
import { prepararGrafoDelTurno } from '../graph/grafo-del-turno'
import type { CodeAgentReply } from '@domain/chat/code-agent'
import { turnoConGrafo } from './turno-con-grafo'

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

    run: async (request, onChunk) => {
      // El grafo de ESTE turno (ADR-095, enmienda): una copia del .db del proyecto
      // en su directorio; el servidor no alcanza la cache real ni a otro cliente.
      const grafo = await prepararGrafoDelTurno(request.projectPath)
      // La caja del CLI (ADR-092, clase A). Sin caja NO hay turno: se contesta
      // como un CLI que no arranca, con el motivo, y nada se lanza.
      const args = argsDelTurno(request, customAgents, mcpConfig, budget.perRun, grafo.dir)
      if (!args.ok) return (grafo.liberar(), sinLanzar(args.error, onChunk))

      const lanzar = (): Promise<CodeAgentReply> => {
        // Solo se pasa la key si el operador eligio facturar a la key. Sin
        // ella, `claude` usa su propia sesion y consume del plan.
        const child = spawn(CLAUDE_BIN, [...args.value.args], { cwd: request.projectPath, env: buildEnv(useApiKey ? apiKeys.read() : null) }) // prettier-ignore
        escribirPrompt(child.stdin, args.value.prompt) // ADR-112
        trackChild(child, request.projectId ?? null)
        // La parada pudo llegar mientras se armaba el turno: `cancelRun` ya mato
        // a los vivos y no vio a este. Un hijo que nace parado, muere al nacer.
        if (request.projectId !== undefined && isCancelled(request.projectId)) killChildrenOf(request.projectId) // prettier-ignore
        return collectRun(child, onChunk, techoMs)
      }

      // La copia muere con el turno por sus TRES salidas, no solo al cerrar el
      // proceso: `spawn` puede tirar antes de que el hijo exista.
      return turnoConGrafo(grafo, lanzar, (motivo) => sinLanzar(motivo, onChunk))
    }
  }
}
