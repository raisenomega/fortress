import { execFileSync } from 'child_process'
import { gitEnv } from './git-env'
import { SIN_HOOKS } from '../sandbox/git-sin-hooks'

/**
 * SHA de HEAD del repo en `dir`, o null si no es un repo git (o git falla).
 * Es el ancla de una propuesta de reparacion: sin repo no hay base que anclar.
 */
export function headSha(dir: string): string | null {
  try {
    const sha = execFileSync('git', [...SIN_HOOKS, 'rev-parse', 'HEAD'], {
      cwd: dir,
      env: gitEnv(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
    return sha === '' ? null : sha
  } catch {
    return null
  }
}
