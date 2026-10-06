import { execFileSync } from 'child_process'
import { SIN_HOOKS } from '../sandbox/git-sin-hooks'

/** Lo minimo para encontrar git y leer ~/.gitconfig (safe.directory). */
const COPIADAS: readonly string[] = ['PATH', 'HOME']
const REENVIADAS: readonly string[] = ['TMPDIR', 'LANG', 'LC_ALL']

/**
 * Entorno en LISTA BLANCA para el rev-parse del repo auditado. gitEnv() parte
 * del entorno entero y solo quita la sesion viva: tokens de terceros
 * (GITHUB_TOKEN, NPM_TOKEN, AWS_*) y las GIT_* del operador (GIT_DIR,
 * GIT_CONFIG_PARAMETERS...) viajaban igual, y estas ultimas desvian el
 * rev-parse a otro repo. `PATH` se lee EN LA LLAMADA: augmentPath() lo completa
 * al arrancar mutando process.env, y uno fijo dejaria a git sin aparecer.
 */
export function headShaEnv(source: NodeJS.ProcessEnv): Record<string, string> {
  const env: Record<string, string> = { GIT_TERMINAL_PROMPT: '0' }
  for (const clave of [...COPIADAS, ...REENVIADAS]) {
    const valor = source[clave]
    if (valor !== undefined) env[clave] = valor
  }
  return env
}

/**
 * SHA de HEAD del repo en `dir`, o null si no es un repo git (o git falla).
 * Es el ancla de una propuesta de reparacion: sin repo no hay base que anclar.
 */
export function headSha(dir: string): string | null {
  try {
    const sha = execFileSync('git', [...SIN_HOOKS, 'rev-parse', 'HEAD'], {
      cwd: dir,
      env: headShaEnv(process.env),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
    return sha === '' ? null : sha
  } catch {
    return null
  }
}
