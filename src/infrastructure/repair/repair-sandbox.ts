import { existsSync, realpathSync } from 'fs'
import { join } from 'path'

export type SandboxCheck = { ok: true } | { ok: false; error: string }

/**
 * assertRepairSandbox (definicion del plan, firmada): el cwd donde el generador
 * va a ESCRIBIR debe (1) ser el worktree registrado de ESA propuesta bajo la
 * raiz de worktrees, (2) ser distinto del checkout vivo del proyecto, y (3)
 * existir como worktree git valido. Editar el vivo sigue prohibido; editar la
 * copia aislada es exactamente el proposito.
 */
export function assertRepairSandbox(
  worktreePath: string,
  proposalId: string,
  worktreeRoot: string,
  liveRepoPath: string
): SandboxCheck {
  let real: string
  let root: string
  let live: string
  try {
    real = realpathSync(worktreePath)
    root = realpathSync(worktreeRoot)
    live = realpathSync(liveRepoPath)
  } catch (error) {
    return { ok: false, error: `sandbox: ruta irresoluble (${error instanceof Error ? error.message : 'fs'})` } // prettier-ignore
  }
  if (real !== join(root, proposalId)) {
    return { ok: false, error: `sandbox: ${real} no es el worktree registrado de ${proposalId.slice(0, 8)}` } // prettier-ignore
  }
  if (real === live) {
    return { ok: false, error: 'sandbox: el worktree ES el checkout vivo; editar el vivo esta prohibido' } // prettier-ignore
  }
  if (!existsSync(join(real, '.git'))) {
    return { ok: false, error: 'sandbox: la carpeta no es un worktree git valido' }
  }
  return { ok: true }
}
