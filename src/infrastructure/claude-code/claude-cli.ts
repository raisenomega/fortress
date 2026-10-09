import { spawnSync } from 'child_process'
import type { AgentId } from '@domain/agent/agent'
import type { AgentDefinition } from '@domain/agent/agent-prompt'
import { withGraph } from '@domain/connectors/graph-mcp'
import { MCP_CONFIG_FLAG } from '@domain/connectors/mcp-config'
import { BUDGET_FLAG } from '@domain/settings/run-budget'
import { claudeModeArg, type ClaudePermissionMode } from '@domain/settings/permission-mode'
import { fuentesDeSettings } from '@domain/settings/fuentes-de-settings'
import { buildAllowedTools, buildDisallowedTools } from './build-allowed-tools'
import type { ConPrompt } from './prompt-por-stdin'

export const CLAUDE_BIN = 'claude'

/**
 * Argumentos del CLI (verificado en `claude --help` 2.1.220): el flag headless
 * es `-p`, no existe `--project` (el proyecto se fija con el cwd del proceso).
 * ADR-112: `-p` va SIN valor y el prompt viaja APARTE, por stdin — los limites
 * de argv del SO (Windows 32 KB TOTALES) no alcanzan a tocarlo.
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
  scripts: readonly string[] = [],
  /** El store del grafo de ESTE turno (ADR-095, enmienda); null = la cache real, solo FORTRESS. */
  grafoDir: string | null = null
): ConPrompt {
  // stream-json solo emite el flujo completo de eventos con --verbose. Y sin
  // confianza, los settings del repo auditado NO cargan (`fuentes-de-settings`).
  // prettier-ignore
  const args = ['-p', '--output-format', 'stream-json', '--verbose', '--permission-mode', claudeModeArg(permissionMode), ...fuentesDeSettings(trusted)]

  // Red de seguridad: sin tope, un agente sobre un repo enorme sigue leyendo
  // hasta agotar la cuota. Cero lo desactiva, si el operador lo decide asi.
  if (maxUsd > 0) args.push(BUDGET_FLAG, String(maxUsd))

  // Allowlist segun el modo: en 'lectura' el grafo EJECUTA (plan lo bloqueaba);
  // en plan/acceptEdits, la regla del grafo + autoverificacion cuando aplica.
  args.push('--allowedTools', ...buildAllowedTools(permissionMode, trusted, scripts))

  // Y lo que se QUITA. `--allowedTools` solo pre-aprueba, asi que impedir una
  // herramienta pide esta otra lista: aqui no se ofrece, no es que se deniegue.
  const fuera = buildDisallowedTools(permissionMode, trusted)
  if (fuera.length > 0) args.push('--disallowedTools', ...fuera)

  if (Object.keys(agents).length > 0) args.push('--agents', JSON.stringify(agents))
  if (agentId) args.push('--agent', agentId)

  // El grafo viaja en TODO spawn. Si no arranca, Claude Code sigue sin el. Y
  // el flag estricto cierra el conjunto: el hijo monta esto y nada del entorno.
  args.push(MCP_CONFIG_FLAG, withGraph(mcpConfig, grafoDir), '--strict-mcp-config')

  return { args, prompt }
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
