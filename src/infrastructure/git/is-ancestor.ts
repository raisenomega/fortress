import { execFileSync } from 'child_process'
import { gitEnv } from './git-env'
import { SIN_HOOKS } from '../sandbox/git-sin-hooks'

/**
 * true si `commit` ya esta contenido en HEAD del repo en `dir`.
 *
 * `git merge-base --is-ancestor` NO responde por stdout: responde por codigo de
 * salida (0 = si, 1 = no, otros = error), asi que aqui se lee la excepcion, no
 * la salida. Sesgo seguro deliberado: cualquier fallo —repo ausente, commit
 * desconocido, git roto— devuelve false, que significa "no puedo probar que se
 * mergeo". Preferimos caducar una propuesta que si llego a main antes que
 * fabricar un MERGEADO que nadie firmo.
 */
export function isAncestor(dir: string, commit: string): boolean {
  try {
    execFileSync('git', [...SIN_HOOKS, 'merge-base', '--is-ancestor', commit, 'HEAD'], {
      cwd: dir,
      env: gitEnv(),
      stdio: ['ignore', 'ignore', 'ignore']
    })
    return true
  } catch {
    return false
  }
}
