import { app } from 'electron'
import { existsSync, readdirSync, rmSync } from 'fs'
import { join } from 'path'
import type { ReclaimDeps } from '@application/repair/reclaim-worktrees'
import type { ReconcileDeps } from '@application/repair/reconcile-orphans'
import { isAncestor } from '../git/is-ancestor'
import { ramaDelMotor } from './repair-git'
import { createWorktreeManager } from './worktree-manager'

/** Deps reales del reclaim de arranque. Separado de repair-deps por el 75. */
export function buildReclaimDeps(): ReclaimDeps {
  const root = join(app.getPath('userData'), 'repair-worktrees')
  const manager = createWorktreeManager()
  return {
    listWorktreeDirs: () => (existsSync(root) ? readdirSync(root) : []),
    pathOf: (proposalId) => join(root, proposalId),
    // La rama va con su worktree. Se pedia el borrado con el nombre en blanco,
    // y `remove` solo borra rama cuando se le da una: el worktree desaparecia y
    // la rama se quedaba. Veintisiete ramas para seis worktrees, en un repo
    // ajeno que el motor solo deberia dejar como lo encontro.
    removeWorktree: async (worktreePath, projectRepoPath) =>
      manager.remove(worktreePath, await ramaDelMotor(worktreePath), projectRepoPath),
    rmDir: (path) => rmSync(path, { recursive: true, force: true }),
    now: Date.now
  }
}

/** Deps de la segunda pasada: la BD manda y git decide. No toca disco. */
export function buildReconcileDeps(): ReconcileDeps {
  const root = join(app.getPath('userData'), 'repair-worktrees')
  return {
    listWorktreeDirs: () => (existsSync(root) ? readdirSync(root) : []),
    isMerged: isAncestor,
    now: Date.now
  }
}
