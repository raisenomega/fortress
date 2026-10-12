import { git } from '../git/git-snapshot'

/**
 * Las rutas que git IGNORA (gitignored y sin trackear), con las CARPETAS
 * colapsadas (`--directory`): `.next/`, `dist/`, un `.env` suelto… (PASO 172a).
 *
 * La foto de integridad vela la FUENTE, no los artefactos de build regenerables:
 * sin esto, un `.next/` que cambia entre el snapshot y el verify marcaba el
 * proyecto CONTAMINADO en falso. Relativas a la raíz del repo.
 *
 * Vacío si no es un repo git o git falla: entonces la foto incluye todo, como
 * antes — nunca MENOS defensa por un git ausente, solo más precisión cuando lo hay.
 */
export function rutasIgnoradas(projectPath: string): ReadonlySet<string> {
  try {
    const salida = git(projectPath, ['ls-files', '--others', '--ignored', '--exclude-standard', '--directory']) // prettier-ignore
    return new Set(
      salida
        .split('\n')
        .map((linea) => linea.trim().replace(/\/$/, ''))
        .filter((linea) => linea.length > 0)
    )
  } catch {
    return new Set()
  }
}
