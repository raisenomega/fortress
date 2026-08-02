import { readFileSync } from 'fs'
import { join } from 'path'

export interface GitInfo {
  readonly remote: string | null
  readonly branch: string | null
}

const NO_GIT: GitInfo = { remote: null, branch: null }

function readText(path: string): string | null {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

/** `ref: refs/heads/main` -> `main`. En detached HEAD no hay rama que mostrar. */
function parseBranch(head: string | null): string | null {
  const match = head?.match(/^ref:\s*refs\/heads\/(.+)$/m)
  return match ? match[1].trim() : null
}

function parseRemote(config: string | null): string | null {
  const match = config?.match(/\[remote "origin"\][^[]*?url\s*=\s*(.+)/)
  return match ? match[1].trim() : null
}

/**
 * Lee .git directamente en vez de invocar el binario `git`: no depende de que
 * este instalado ni lanza procesos con una ruta que viene del usuario.
 */
export function readGitInfo(projectPath: string): GitInfo {
  const gitDir = join(projectPath, '.git')
  const head = readText(join(gitDir, 'HEAD'))
  if (head === null) return NO_GIT

  return {
    branch: parseBranch(head),
    remote: parseRemote(readText(join(gitDir, 'config')))
  }
}
