import { reclaimWorktrees } from '@application/repair/reclaim-worktrees'
import { getAppContext } from '../persistence/app-context'
import { buildReclaimDeps } from './reclaim-deps'

/**
 * Reconcilia los worktrees huerfanos al arrancar, en background y con falla
 * suave: un error aqui se anota y la app arranca igual.
 */
export function reclaimRepairWorktrees(): void {
  void reclaimWorktrees(getAppContext(), buildReclaimDeps()).catch((error) =>
    console.error('[repair-cleanup] fallo el reclaim de arranque', error)
  )
}
