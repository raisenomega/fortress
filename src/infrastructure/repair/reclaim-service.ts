import { reclaimWorktrees } from '@application/repair/reclaim-worktrees'
import { reconcileOrphanProposals } from '@application/repair/reconcile-orphans'
import { getAppContext } from '../persistence/app-context'
import { buildReclaimDeps, buildReconcileDeps } from './reclaim-deps'

/**
 * Reconcilia al arrancar, en background y con falla suave: un error aqui se
 * anota y la app arranca igual. Dos pasadas, una por sentido — disco -> BD
 * primero (retira lo que sobra) y BD -> git despues (cierra lo que falta).
 * El orden importa: la primera puede dejar propuestas en estado terminal que
 * la segunda ya no tiene que mirar (ADR-059).
 */
export function reclaimRepairWorktrees(): void {
  const ctx = getAppContext()
  void reclaimWorktrees(ctx, buildReclaimDeps())
    .then(() => reconcileOrphanProposals(ctx, buildReconcileDeps()))
    .catch((error) => console.error('[repair-cleanup] fallo el reclaim de arranque', error))
}
