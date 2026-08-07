import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Nombres de los scripts del `package.json` del proyecto. Con ellos se arma el
 * allowlist de autoverificacion contra los scripts REALES del repo (uno usa
 * `type-check` y `test`, otro `typecheck` y `test:unit`), en vez de una lista
 * fija que no coincide. Devuelve vacio si no hay package.json o scripts.
 */
export function readProjectScripts(projectPath: string): readonly string[] {
  try {
    const raw = readFileSync(join(projectPath, 'package.json'), 'utf8')
    const parsed = JSON.parse(raw) as { scripts?: Record<string, string> }
    return parsed.scripts ? Object.keys(parsed.scripts) : []
  } catch {
    return []
  }
}
