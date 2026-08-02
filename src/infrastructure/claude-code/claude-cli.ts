import { spawnSync } from 'child_process'
import type { ClaudePermissionMode } from '@domain/settings/permission-mode'

export const CLAUDE_BIN = 'claude'

/**
 * Argumentos del CLI. Verificados contra `claude --help` de la version 2.1.220:
 * el flag no interactivo es `-p`, no `--headless`, y no existe `--project`
 * (el proyecto se fija con el cwd del proceso).
 */
export function buildArgs(prompt: string, permissionMode: ClaudePermissionMode): string[] {
  return [
    '-p',
    prompt,
    '--output-format',
    'stream-json',
    // stream-json solo emite el flujo completo de eventos con --verbose.
    '--verbose',
    '--permission-mode',
    permissionMode
  ]
}

/** Comprueba que el CLI responde. El PATH ya viene completado por augmentPath. */
export function isClaudeInstalled(): boolean {
  try {
    const probe = spawnSync(CLAUDE_BIN, ['--version'], { encoding: 'utf8', timeout: 8000 })
    return !probe.error && probe.status === 0
  } catch {
    return false
  }
}

/**
 * Entorno del proceso hijo. Si el operador configuro una key en FORTRESS se le
 * pasa; si no, se deja que `claude` use sus propias credenciales (login OAuth),
 * que es como funciona en la terminal.
 */
export function buildEnv(apiKey: string | null): NodeJS.ProcessEnv {
  if (!apiKey) return process.env
  return { ...process.env, ANTHROPIC_API_KEY: apiKey }
}
