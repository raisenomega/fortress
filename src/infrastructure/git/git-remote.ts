import { esUrlDeRemoto } from '@domain/project/git-remote-url'
import type { GitRemoteSetter } from '@domain/project/git-config-setter'
import { err, ok, type Result } from '@domain/shared/result'
import { git, isRepoRoot } from './git-snapshot'

const NO_RAIZ = 'La carpeta no es la raíz de su propio repo git: no fijo el remoto ahí.'

/** ¿Ya hay un origin? Si `get-url` revienta, no lo hay (y se crea con `add`). */
function tieneOrigin(cwd: string): boolean {
  try {
    git(cwd, ['remote', 'get-url', 'origin'])
    return true
  } catch {
    return false
  }
}

/**
 * Fija el `origin` del proyecto (PASO 163): `set-url` si ya existe, `add` si no.
 * El dominio valida la URL; aquí solo se escribe. Guarda `isRepoRoot` como el
 * push: si la carpeta fuese subcarpeta de un repo padre, se tocaría el padre.
 */
export function createGitRemoteSetter(): GitRemoteSetter {
  return {
    setRemote: (projectPath, url): Result<string> => {
      const u = url.trim()
      if (!esUrlDeRemoto(u)) return err('URL de remoto inválida (usa https:// o git@host:…).')
      if (!isRepoRoot(projectPath)) return err(NO_RAIZ)
      try {
        const sub = tieneOrigin(projectPath) ? ['remote', 'set-url', 'origin', u] : ['remote', 'add', 'origin', u] // prettier-ignore
        git(projectPath, sub)
        return ok(`Remoto origin → ${u}`)
      } catch (error) {
        return err(error instanceof Error ? error.message : 'git remote falló')
      }
    }
  }
}
