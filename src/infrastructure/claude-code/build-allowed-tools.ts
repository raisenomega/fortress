import { GRAPH_READ_TOOLS } from '@domain/connectors/graph-mcp'
import type { ClaudePermissionMode } from '@domain/settings/permission-mode'
import { selfVerifyRules } from '@domain/settings/safe-commands'

/** Lectura de archivos permitida en modo 'lectura' (corre en 'default' de Claude). */
const READ_TOOLS = ['Read', 'Grep', 'Glob', 'LS']

/**
 * El allowlist de --allowedTools segun el modo.
 *
 * `--allowedTools` PRE-APRUEBA: lo listado no pide permiso. NO deniega lo demas.
 * Medido el 2026-09-20 con `--permission-mode default --allowedTools Read`:
 * `Bash` se ejecuto igual, con `permission_denials` VACIO. Solo `Write`/`Edit`
 * quedan fuera, y no por la lista: por pedir permiso, que en headless no hay
 * quien conceda (ese si aparece en `permission_denials`).
 *
 * ESTE DOCBLOCK AFIRMABA LO CONTRARIO —«escribir/Bash quedan denegados por no
 * estar en la lista»— y era falso. Lo creyo todo el que lo leyo, incluido quien
 * escribio la pieza de arriba. Para impedir de verdad una herramienta hace falta
 * `--disallowedTools`, que es lo que hay debajo.
 *
 * El resto sigue igual: en plan/acceptEdits van las de lectura del grafo + la
 * autoverificacion si aplica. Antes iba un prefijo que abria el servidor entero:
 * en `plan` daba igual —Claude bloquea todo MCP ahi— pero en `acceptEdits`, que
 * es el modo autonomo, le concedia `delete_project` a un agente sin nadie delante.
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

/**
 * Lo que `--disallowedTools` QUITA, que es la unica forma real de impedir una
 * herramienta: medido el 2026-09-20, con `--disallowedTools Bash` el agente
 * contesta «NO_PUDE_BASH» y `permission_denials` sale VACIO — no es que se
 * deniegue la llamada, es que la herramienta no se le ofrece.
 *
 * Solo en 'lectura', y es lo que hace que ese nombre sea cierto: `Read`, `Grep`,
 * `Glob` y `LS` no pueden modificar nada, `Write`/`Edit` los para el permiso, y
 * Bash era el unico agujero —una redireccion suya escribio en /tmp el 12-sep—.
 *
 * Lo pedia el contrato del clasificador de alcance desde el 10-sep: «No edites
 * ni ejecutes nada». Sus CUATRO corridas posteriores usaron Bash entre 30 y 63
 * veces. Un prompt no impone nada; esto si.
 *
 * 'auditoria' NO lo lleva: el escaner vive de ejecutar (241 de 353 llamadas).
 */
export function buildDisallowedTools(mode: ClaudePermissionMode): readonly string[] {
  return mode === 'lectura' ? ['Bash'] : []
}
