import { GRAPH_READ_TOOLS } from '@domain/connectors/graph-mcp'
import type { ClaudePermissionMode } from '@domain/settings/permission-mode'
import { selfVerifyRules } from '@domain/settings/safe-commands'

/** Lectura de archivos permitida en modo 'lectura' (corre en 'default' de Claude). */
const READ_TOOLS = ['Read', 'Grep', 'Glob', 'LS']

/**
 * El allowlist de --allowedTools segun el modo. En 'lectura' se permiten SOLO las
 * tools de LECTURA del grafo + lectura de archivos: el grafo ejecuta (plan lo
 * bloqueaba) y escribir/Bash quedan denegados por no estar en la lista. En
 * plan/acceptEdits, las MISMAS de lectura del grafo + la autoverificacion si
 * aplica. Antes iba un prefijo que abria el servidor entero: en `plan` daba
 * igual —Claude bloquea todo MCP ahi— pero en `acceptEdits`, que es el modo
 * autonomo, le concedia `delete_project` a un agente sin nadie delante.
 */
export function buildAllowedTools(
  mode: ClaudePermissionMode,
  trusted: boolean,
  scripts: readonly string[]
): readonly string[] {
  if (mode === 'lectura') return [...GRAPH_READ_TOOLS, ...READ_TOOLS]
  return [...GRAPH_READ_TOOLS, ...selfVerifyRules(mode, trusted, scripts)]
}
