import type { OperationMode } from './operation-mode'

/** Modos de permiso de Claude Code que usa FORTRESS. */
export type ClaudePermissionMode = 'plan' | 'acceptEdits'

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
  acceptEdits: 'Puede editar archivos del proyecto'
}
