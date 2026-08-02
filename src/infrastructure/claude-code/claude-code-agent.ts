import { spawn } from 'child_process'
import { existsSync, statSync } from 'fs'
import type { CodeAgent } from '@domain/chat/code-agent'
import type { ApiKeyStore } from '@domain/settings/api-key-store'
import { buildArgs, buildEnv, CLAUDE_BIN, isClaudeInstalled } from './claude-cli'
import { collectRun } from './run-claude-process'

/**
 * Ejecuta Claude Code dentro de la carpeta del proyecto. A diferencia del chat
 * por API, este agente tiene acceso real: filesystem, bash, git, npm.
 *
 * El proyecto se fija con el cwd del proceso: el CLI no tiene flag --project.
 */
export function createClaudeCodeAgent(apiKeys: ApiKeyStore): CodeAgent {
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
      const child = spawn(CLAUDE_BIN, buildArgs(request.prompt, request.permissionMode), {
        cwd: request.projectPath,
        env: buildEnv(apiKeys.read())
      })

      return collectRun(child, onChunk)
    }
  }
}
