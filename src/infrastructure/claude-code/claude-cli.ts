import { spawnSync } from 'child_process'
import type { AgentId } from '@domain/agent/agent'
import type { AgentDefinition } from '@domain/agent/agent-prompt'
import { MCP_CONFIG_FLAG } from '@domain/connectors/mcp-config'
import { BUDGET_FLAG } from '@domain/settings/run-budget'
import { selfVerifyRules } from '@domain/settings/safe-commands'
import type { ClaudePermissionMode } from '@domain/settings/permission-mode'

export const CLAUDE_BIN = 'claude'

/**
 * Argumentos del CLI. Verificados contra `claude --help` de la version 2.1.220:
 * el flag no interactivo es `-p`, no `--headless`, y no existe `--project`
 * (el proyecto se fija con el cwd del proceso).
 */
export function buildArgs(
  prompt: string,
  permissionMode: ClaudePermissionMode,
  agents: Readonly<Record<string, AgentDefinition>>,
  agentId: AgentId | null,
  maxUsd: number,
  /** JSON de buildMcpConfig, o null si no hay conectores activos. */
  mcpConfig: string | null = null,
  /** Proyecto de confianza. Default false: el allowlist NO se pasa por defecto. */
  trusted = false
): string[] {
  const args = [
    '-p',
    prompt,
    '--output-format',
    'stream-json',
    // stream-json solo emite el flujo completo de eventos con --verbose.
    '--verbose',
    '--permission-mode',
    permissionMode
  ]

  // Red de seguridad: sin tope, un agente sobre un repo enorme sigue leyendo
  // hasta agotar la cuota. Cero lo desactiva, si el operador lo decide asi.
  if (maxUsd > 0) args.push(BUDGET_FLAG, String(maxUsd))

  // El allowlist SOLO al editar (acceptEdits) en repo de confianza: `npm run X`
  // es codigo del repo auditado. En plan o repo no confiable, bash sigue bloqueado.
  const verifyRules = selfVerifyRules(permissionMode, trusted)
  if (verifyRules.length > 0) args.push('--allowedTools', ...verifyRules)

  // Los diez agentes viajan como JSON: FORTRESS no escribe nada en el repo.
  if (Object.keys(agents).length > 0) args.push('--agents', JSON.stringify(agents))
  if (agentId) args.push('--agent', agentId)

  // Aditivo: sin conectores mcpConfig es null y los args salen como antes.
  if (mcpConfig) args.push(MCP_CONFIG_FLAG, mcpConfig)

  return args
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
