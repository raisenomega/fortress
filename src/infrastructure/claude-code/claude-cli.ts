import { spawnSync } from 'child_process'
import type { AgentId } from '@domain/agent/agent'
import type { AgentDefinition } from '@domain/agent/agent-prompt'
import { withGraph } from '@domain/connectors/graph-mcp'
import { MCP_CONFIG_FLAG } from '@domain/connectors/mcp-config'
import { BUDGET_FLAG } from '@domain/settings/run-budget'
import { claudeModeArg, type ClaudePermissionMode } from '@domain/settings/permission-mode'
import { buildAllowedTools } from './build-allowed-tools'

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
  // stream-json solo emite el flujo completo de eventos con --verbose.
  // prettier-ignore
  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--permission-mode', claudeModeArg(permissionMode)]

  // Red de seguridad: sin tope, un agente sobre un repo enorme sigue leyendo
  // hasta agotar la cuota. Cero lo desactiva, si el operador lo decide asi.
  if (maxUsd > 0) args.push(BUDGET_FLAG, String(maxUsd))

  // Allowlist segun el modo: en 'lectura' el grafo EJECUTA (plan lo bloqueaba);
  // en plan/acceptEdits, la regla del grafo + autoverificacion cuando aplica.
  args.push('--allowedTools', ...buildAllowedTools(permissionMode, trusted, scripts))

  if (Object.keys(agents).length > 0) args.push('--agents', JSON.stringify(agents))
  if (agentId) args.push('--agent', agentId)

  // El grafo viaja en TODO spawn. Si no arranca, Claude Code sigue sin el. Y
  // el flag estricto cierra el conjunto: el hijo monta esto y nada del entorno.
  args.push(MCP_CONFIG_FLAG, withGraph(mcpConfig), '--strict-mcp-config')

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

/** Llaves de la SESION VIVA del operador; el porque de cada una, en `repair/gate-env.ts`. */
// prettier-ignore
const SESION_VIVA: readonly string[] = ['SSH_AUTH_SOCK', 'GNOME_KEYRING_CONTROL', 'GPG_AGENT_INFO', 'XAUTHORITY', 'DISPLAY', 'DBUS_SESSION_BUS_ADDRESS', 'LD_LIBRARY_PATH', 'npm_config__auth']

/**
 * Entorno del hijo, menos esas llaves: el CLI corre con cwd en el repo AUDITADO
 * y su allowlist le deja lanzar sus `npm run` y sus MCP, nietos que heredan
 * ESTE entorno. Recorte y no lista blanca como el gate: alli el hijo ES el repo
 * auditado; aqui es el CLI, y lo que el y sus MCP necesitan no lo enumero nadie.
 * Con key configurada se le pasa; sin ella `claude` usa las suyas (login OAuth).
 * LIMITE: la key SI viaja —es la eleccion de facturacion— y la ven los nietos.
 */
export function buildEnv(apiKey: string | null): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env }
  for (const clave of SESION_VIVA) delete env[clave]
  return apiKey ? { ...env, ANTHROPIC_API_KEY: apiKey } : env
}
