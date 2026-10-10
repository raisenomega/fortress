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
  // 'libre' (PASO 99, FRONTERA firmada): SOLO WebSearch — del lado servidor,
  // por el canal del modelo que la caja ya deja pasar (sonda verde con
  // allowedDomains:[]). WebFetch va DENEGADO abajo en la lista (PASO 142), no
  // diferido; grafo y disco fuera: el cuarto esta vacio.
  if (mode === 'libre') return ['WebSearch']
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
 * Bash solo en 'lectura' (el clasificador tiene prohibido ejecutar; una
 * redireccion suya escribio en /tmp el 12-sep) y en 'libre' (powers-off).
 * 'auditoria' NO lo lleva: el escaner vive de ejecutar (241 de 353 llamadas).
 *
 * FRONTERA 137 (firma de Jojo): trusted DEGRADA al trabajo SIN confianza
 * (pierde WebSearch+WebFetch); 'libre'/cto quedan FUERA, su WebSearch es
 * sagrado. PASO 142 (firma de Jojo): y ademas 'libre' DENIEGA WebFetch en la
 * LISTA (fetch local = SSRF) — estructural, no por el muro de permiso; el
 * «diferido» del PASO 99 queda cerrado. El candado se ensancha, jamas afloja.
 */
export function buildDisallowedTools(mode: ClaudePermissionMode, trusted: boolean): readonly string[] { // prettier-ignore
  const base = mode === 'lectura' || mode === 'libre' ? ['Bash'] : []
  const sinFetchLibre = mode === 'libre' ? ['WebFetch'] : []
  const sinWeb = !trusted && mode !== 'libre' ? ['WebSearch', 'WebFetch'] : []
  return [...base, ...sinFetchLibre, ...sinWeb]
}
