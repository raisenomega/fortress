export interface ScopeResult {
  readonly ok: boolean
  /** Archivos tocados que NO estaban permitidos, relativos al repo. */
  readonly violations: readonly string[]
}

/**
 * La correa de D10 se verifica POST-generacion contra lo que git vio, no
 * contra lo que el agente dijo tocar. Rutas relativas al repo en ambos lados.
 */
export function checkScope(
  changedFiles: readonly string[],
  allowedFiles: readonly string[]
): ScopeResult {
  const allowed = new Set(allowedFiles)
  const violations = changedFiles.filter((file) => !allowed.has(file))
  return { ok: violations.length === 0, violations }
}
