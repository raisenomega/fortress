import { spawnSync } from 'child_process'
import type { AgentId } from '@domain/agent/agent'
import type { AgentDefinition } from '@domain/agent/agent-prompt'
import { GRAPH_TOOL_RULE, withGraph } from '@domain/connectors/graph-mcp'
import { MCP_CONFIG_FLAG } from '@domain/connectors/mcp-config'
import { BUDGET_FLAG } from '@domain/settings/run-budget'
import { selfVerifyRules } from '@domain/settings/safe-commands'
import type { ClaudePermissionMode } from '@domain/settings/permission-mode'

export const CLAUDE_BIN = 'claude'

/**
 * Argumentos del CLI (verificado en `claude --help` 2.1.220): el flag headless
 * es `-p`, no existe `--project` (el proyecto se fija con el cwd del proceso).
 */
export function buildArgs(
  prompt: string,
  permissionMode: ClaudePermissionMode,
  agents: Readonly<Record<string, AgentDefinition>>,
  agentId: AgentId | null,
  maxUsd: number,
  /** JSON MCP (conectores + .mcp.json del proyecto), o null. */
  mcpConfig: string | null = null,
  // trusted -> pasa allowlist; scripts (del package.json) -> de que se arma.
  trusted = false,
  scripts: readonly string[] = []
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

  // Grafo SIEMPRE permitido (su consulta es no negociable); el allowlist de
  // autoverificacion solo al editar en repo de confianza. Sin la regla del
  // grafo, en plan headless la llamada al MCP se auto-deniega y cae a Bash.
  args.push('--allowedTools', GRAPH_TOOL_RULE, ...selfVerifyRules(permissionMode, trusted, scripts))

  if (Object.keys(agents).length > 0) args.push('--agents', JSON.stringify(agents))
  if (agentId) args.push('--agent', agentId)

  // El grafo viaja en TODO spawn. Si no arranca, Claude Code sigue sin el.
  args.push(MCP_CONFIG_FLAG, withGraph(mcpConfig))

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
