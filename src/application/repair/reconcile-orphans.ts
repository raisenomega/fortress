import type { AppContext } from '../context'
import { advanceProposal } from './advance-proposal'
import { cursorFrom } from './book-cursor'
import { commitOf, decideOrphan } from './reconcile-verdict'

export interface ReconcileDeps {
  /** Nombres de dir bajo la raiz de worktrees = ids de propuesta. */
  listWorktreeDirs(): string[]
  /** true SOLO si se puede probar que el commit ya esta en HEAD del repo. */
  isMerged(repoPath: string, commitSha: string): boolean
  now(): number
}

/**
 * Segunda pasada del arranque, en la direccion que faltaba: BD -> disco y git.
 * La primera recorre los worktrees y busca su propuesta; esta recorre las
 * propuestas VIVAS y busca su worktree. Sin ella, una propuesta cuyo worktree
 * se retiro a mano queda viva para siempre, y con el descuento de la cola de
 * candidatos eso congela su hallazgo (ADR-059, manifestaciones 3 y 4).
 *
 * Cuando el worktree falta, git decide: si el commit del fix ya esta en HEAD,
 * la propuesta llego a su destino y se registra; si no, caduca con la razon que
 * explica por que. Falla suave: la reconciliacion jamas aborta el arranque.
 */
export async function reconcileOrphanProposals(
  ctx: AppContext,
  deps: ReconcileDeps
): Promise<{ merged: number; expired: number }> {
  const dirs = new Set(deps.listWorktreeDirs())
  let merged = 0
  let expired = 0
  for (const proposal of ctx.repairProposals.listLive()) {
    if (dirs.has(proposal.id)) continue
    try {
      const events = await ctx.eventLog.list(proposal.id)
      const repo = ctx.projects.findById(proposal.projectId)?.path ?? null
      const verdict = decideOrphan(proposal.state, commitOf(events), repo, deps.isMerged)
      if (verdict === null) continue
      await advanceProposal(ctx, proposal, verdict.path, verdict.reason, cursorFrom(events), deps.now()) // prettier-ignore
      if (verdict.path.includes('MERGEADO')) merged += 1
      else expired += 1
    } catch (error) {
      console.error('[repair-cleanup] fallo reconciliando', proposal.id, error)
    }
  }
  console.info(`[repair-cleanup] merged=${merged} expired=${expired}`)
  return { merged, expired }
}
