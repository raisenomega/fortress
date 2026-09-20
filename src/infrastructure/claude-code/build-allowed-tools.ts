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
 *
 * 'auditoria' es 'lectura' MAS Bash entero, y es el modo del escaner. El Bash no
 * se acota a una lista de comandos a proposito: una auditoria explora, y decidir
 * de antemano que puede mirar es el freno que ADR-090 §0 prohibe. El recibo del
 * 18-sep lo dimensiona — 241 de 353 llamadas fueron Bash.
 *
 * NO LE CONCEDE NADA QUE NO TUVIERA. En `plan` ese Bash ya corria, regalado por
 * el modo y sin constar en ninguna lista —y sin ser de solo lectura: una
 * redireccion suya escribio en /tmp—. Lo que cambia es que ahora esta ESCRITO:
 * el mismo poder, declarado donde se puede auditar. Write y Edit siguen fuera:
 * auditar es mirar.
 */
export function buildAllowedTools(
  mode: ClaudePermissionMode,
  trusted: boolean,
  scripts: readonly string[]
): readonly string[] {
  if (mode === 'lectura') return [...GRAPH_READ_TOOLS, ...READ_TOOLS]
  if (mode === 'auditoria') return [...GRAPH_READ_TOOLS, ...READ_TOOLS, 'Bash']
  return [...GRAPH_READ_TOOLS, ...selfVerifyRules(mode, trusted, scripts)]
}
