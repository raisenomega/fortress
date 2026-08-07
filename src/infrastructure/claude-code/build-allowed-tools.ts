import { GRAPH_READ_TOOLS, GRAPH_TOOL_RULE } from '@domain/connectors/graph-mcp'
import type { ClaudePermissionMode } from '@domain/settings/permission-mode'
import { selfVerifyRules } from '@domain/settings/safe-commands'

/** Lectura de archivos permitida en modo 'lectura' (corre en 'default' de Claude). */
const READ_TOOLS = ['Read', 'Grep', 'Glob', 'LS']

/**
 * El allowlist de --allowedTools segun el modo. En 'lectura' se permiten SOLO las
 * tools de LECTURA del grafo + lectura de archivos: el grafo ejecuta (plan lo
 * bloqueaba) y escribir/Bash quedan denegados por no estar en la lista. En
 * plan/acceptEdits, la regla del grafo (prefijo) + la autoverificacion si aplica.
 */
export function buildAllowedTools(
  mode: ClaudePermissionMode,
  trusted: boolean,
  scripts: readonly string[]
): readonly string[] {
  if (mode === 'lectura') return [...GRAPH_READ_TOOLS, ...READ_TOOLS]
  return [GRAPH_TOOL_RULE, ...selfVerifyRules(mode, trusted, scripts)]
}
