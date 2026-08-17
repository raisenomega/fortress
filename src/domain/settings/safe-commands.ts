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
 * El script REAL con el que este repo cumple una intencion de verificacion, o
 * null si no la cumple con ninguno. La intencion se nombra por su alias
 * canonico (`typecheck`, `lint`, `test:unit`) y vale cualquiera de su fila: un
 * repo que llama `type-check` a lo mismo se verifica igual.
 */
export function resolveVerifyScript(intent: string, scripts: readonly string[]): string | null {
  const fila = VERIFY_SCRIPTS.find((candidates) => candidates.includes(intent))
  if (fila === undefined) return null

  const set = new Set(scripts)
  return fila.find((name) => set.has(name)) ?? null
}

/**
 * Reglas de --allowedTools derivadas de los scripts del proyecto. Cada regla es
 * un comando EXACTO (`Bash(npm run <script>)`), sin comodines: el agente puede
 * correr `npm run lint` pero no `npm run lint && rm -rf`, ni ningun otro script.
 */
export function safeCommandRules(scripts: readonly string[]): readonly string[] {
  const rules: string[] = []
  for (const candidates of VERIFY_SCRIPTS) {
    const found = resolveVerifyScript(candidates[0] ?? '', scripts)
    if (found !== null) rules.push(`Bash(npm run ${found})`)
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
