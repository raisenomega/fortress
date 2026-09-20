import type { OperationMode } from './operation-mode'

/**
 * Modos de permiso que usa FORTRESS. 'lectura' es solo-lectura PERO con el grafo
 * ejecutando: 'plan' de Claude Code BLOQUEA todas las llamadas MCP (verificado en
 * vivo: el agente reporta "el modo plan bloquea todas las llamadas MCP"), asi que
 * el grafo nunca respondia. 'lectura' corre en 'default' con solo las tools de
 * lectura permitidas — el grafo contesta, y escribir sigue denegado (sin allowlist).
 */
export type ClaudePermissionMode = 'plan' | 'acceptEdits' | 'lectura' | 'auditoria'

/**
 * El valor real de `--permission-mode`. Los DOS modos de lectura corren en
 * `default` por lo mismo: `plan` mata el MCP y ahi el grafo no responde.
 *
 * Se separan porque piden cosas opuestas de Bash, y fundirlos seria el error:
 * `lectura` NO lo lleva —el clasificador de alcance tiene prohibido ejecutar—,
 * y `auditoria` SI —el escaner vive de ejecutar: 241 de sus 353 llamadas del
 * 18-sep fueron Bash—.
 */
export function claudeModeArg(mode: ClaudePermissionMode): string {
  return mode === 'lectura' || mode === 'auditoria' ? 'default' : mode
}

/**
 * Traduce el modo de FORTRESS al de Claude Code. Es la regla que da sentido
 * real al interruptor: en supervisado el agente lee, analiza y propone pero
 * NO puede escribir en el proyecto; solo en autonomo se le permite editar.
 *
 * Nunca devuelve bypassPermissions: aunque el operador pida autonomia, las
 * operaciones peligrosas siguen necesitando permiso y quedan registradas.
 */
export function permissionModeFor(mode: OperationMode): ClaudePermissionMode {
  return mode === 'autonomo' ? 'acceptEdits' : 'plan'
}

/** Lo que se le explica al operador sobre lo que el agente puede hacer. */
export const PERMISSION_SUMMARY: Record<ClaudePermissionMode, string> = {
  plan: 'Lee y analiza el proyecto, pero no modifica archivos',
  auditoria: 'Lee, consulta el grafo y ejecuta comandos, pero no modifica archivos',
  lectura: 'Lee y consulta el grafo, pero no modifica archivos',
  acceptEdits: 'Puede editar archivos del proyecto'
}
