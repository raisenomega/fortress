import { execFileSync } from 'child_process'
import { SIN_HOOKS } from '../sandbox/git-sin-hooks'

/**
 * Lista BLANCA, construida desde {}, no el recorte de `gitEnv`: un GIT_DIR o
 * GIT_OBJECT_DIRECTORY heredado haria responder a merge-base sobre OTRO repo, y
 * un true alli fabrica un MERGEADO. HOME para que el safe.directory del
 * ~/.gitconfig del operador siga valiendo. Se compone AL LLAMAR (DEUDAS §14).
 */
function entornoDelAncestro(): NodeJS.ProcessEnv {
  const env: Record<string, string> = {}
  for (const clave of ['PATH', 'HOME', 'TMPDIR']) {
    const valor = process.env[clave]
    if (valor !== undefined) env[clave] = valor
  }
  return { ...env, GIT_TERMINAL_PROMPT: '0' }
}

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
      env: entornoDelAncestro(),
      stdio: ['ignore', 'ignore', 'ignore']
    })
    return true
  } catch {
    return false
  }
}
