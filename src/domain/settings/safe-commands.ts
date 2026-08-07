import type { ClaudePermissionMode } from './permission-mode'

/**
 * Intenciones de verificacion y los nombres de script que suele usar cada una,
 * por preferencia. Para cada intencion se permite el PRIMER script que el repo
 * tenga: asi coincide con los scripts REALES (un repo usa `type-check` y `test`,
 * otro `typecheck` y `test:unit`) en vez de una lista fija que no encaja.
 */
const VERIFY_SCRIPTS: readonly (readonly string[])[] = [
  ['typecheck', 'type-check', 'tsc', 'check-types', 'types'],
  ['lint', 'eslint'],
  ['test:unit', 'test', 'unit', 'test:ci']
]

/**
 * Reglas de --allowedTools derivadas de los scripts del proyecto. Cada regla es
 * un comando EXACTO (`Bash(npm run <script>)`), sin comodines: el agente puede
 * correr `npm run lint` pero no `npm run lint && rm -rf`, ni ningun otro script.
 */
export function safeCommandRules(scripts: readonly string[]): readonly string[] {
  const set = new Set(scripts)
  const rules: string[] = []
  for (const candidates of VERIFY_SCRIPTS) {
    const found = candidates.find((name) => set.has(name))
    if (found) rules.push(`Bash(npm run ${found})`)
  }
  return rules
}

/**
 * El allowlist SOLO se pasa cuando el agente va a EDITAR de verdad (acceptEdits)
 * Y el proyecto es de confianza. `npm run <script>` ejecuta lo que el package.json
 * del repo AUDITADO defina; en un repo no confiable eso seria ejecucion arbitraria.
 * En plan (escaneo o supervisado) no edita, asi que no necesita autoverificarse.
 */
export function selfVerifyRules(
  mode: ClaudePermissionMode,
  trusted: boolean,
  scripts: readonly string[]
): readonly string[] {
  return mode === 'acceptEdits' && trusted ? safeCommandRules(scripts) : []
}
