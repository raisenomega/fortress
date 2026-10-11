import type { GitIdentitySetter } from '@domain/project/git-config-setter'
import { err, ok, type Result } from '@domain/shared/result'
import { git, isRepoRoot } from './git-snapshot'

const NO_RAIZ = 'La carpeta no es la raíz de su propio repo git: no fijo identidad ahí.'

/**
 * Fija la identidad git LOCAL del proyecto (PASO 163). `git config user.name`
 * SIN `--global`: escribe en `.git/config` del proyecto, nunca el del operador.
 * Reusa el runner `git()` del checkpoint (SIN_HOOKS, entorno acotado). Guarda
 * `isRepoRoot` como el push: sin raíz propia no se toca nada.
 */
export function createGitIdentitySetter(): GitIdentitySetter {
  return {
    setIdentity: (projectPath, name, email): Result<string> => {
      const n = name.trim()
      const e = email.trim()
      if (n.length === 0 || e.length === 0) return err('Nombre y correo son obligatorios.')
      if (!isRepoRoot(projectPath)) return err(NO_RAIZ)
      try {
        git(projectPath, ['config', 'user.name', n])
        git(projectPath, ['config', 'user.email', e])
        return ok(`Identidad fijada: ${n} <${e}>`)
      } catch (error) {
        return err(error instanceof Error ? error.message : 'git config falló')
      }
    }
  }
}
