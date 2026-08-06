import type { ClaudePermissionMode } from './permission-mode'

/**
 * Comandos que el agente puede correr SOLO para verificarse: comprobar tipos,
 * lint y tests unitarios. Nada mas. Es el punto medio entre "no puede ejecutar
 * nada" (no se autoverifica) y "puede ejecutar cualquier cosa" (peligroso).
 *
 * No hay comodines a proposito: cada patron es un comando exacto. Asi el agente
 * puede correr `npm run test:unit` pero no `npm run test:unit && rm -rf`, ni
 * ningun otro script. Y jamas se activa bypassPermissions: todo lo demas
 * —borrar, red, git push— sigue necesitando permiso que en headless se deniega.
 */
const SAFE = ['npm run typecheck', 'npm run lint', 'npm run test:unit'] as const

/** Reglas de herramienta en el formato que espera `claude --allowedTools`. */
export function safeCommandRules(): readonly string[] {
  return SAFE.map((command) => `Bash(${command})`)
}

/**
 * El allowlist SOLO se pasa cuando el agente va a EDITAR de verdad
 * (acceptEdits) Y el proyecto es de confianza. Motivo: `npm run <script>`
 * ejecuta lo que el package.json del repo AUDITADO defina; en un repo no
 * confiable eso seria ejecucion de codigo arbitrario. En plan (escaneo o
 * supervisado) el agente no edita, asi que no necesita autoverificarse.
 */
export function selfVerifyRules(mode: ClaudePermissionMode, trusted: boolean): readonly string[] {
  return mode === 'acceptEdits' && trusted ? safeCommandRules() : []
}
