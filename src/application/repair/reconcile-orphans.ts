import { canTransition, type Proposal, type ProposalState } from '@domain/repair/proposal'
import { buildTransitionEvent, type EventPhase } from '@domain/repair/proposal-event'
import type { AppContext } from '../context'
import { cursorFrom, next, safeRecord, type BookCursor } from './book-cursor'
import { commitOf, decideOrphan } from './reconcile-verdict'

export interface ReconcileDeps {
  /** Nombres de dir bajo la raiz de worktrees = ids de propuesta. */
  listWorktreeDirs(): string[]
  /** true SOLO si se puede probar que el commit ya esta en HEAD del repo. */
  isMerged(repoPath: string, commitSha: string): boolean
  now(): number
}

const FASE: Readonly<Record<string, EventPhase>> = {
  APROBADO: 'APPROVE',
  MERGEADO: 'MERGE',
  CADUCADO: 'EXPIRE'
}

/** Recorre el camino firmado. canTransition sigue siendo el unico juez. */
async function advance(
  ctx: AppContext,
  proposal: Proposal,
  path: readonly ProposalState[],
  reason: string,
  cursor: BookCursor,
  now: number
): Promise<void> {
  let from = proposal.state
  for (const to of path) {
    if (!canTransition(from, to)) return
    ctx.repairProposals.update(proposal.id, { state: to, analysisVerdict: proposal.analysisVerdict ?? 'REAL', analysisReason: reason, updatedAt: now }) // prettier-ignore
    await safeRecord(ctx.eventLog, buildTransitionEvent({ proposalId: proposal.id, seq: next(cursor), phase: FASE[to] ?? 'EXPIRE', fromState: from, toState: to, reason, ts: now })) // prettier-ignore
    from = to
  }
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
      await advance(ctx, proposal, verdict.path, verdict.reason, cursorFrom(events), deps.now())
      if (verdict.path.includes('MERGEADO')) merged += 1
      else expired += 1
    } catch (error) {
      console.error('[repair-cleanup] fallo reconciliando', proposal.id, error)
    }
  }
  console.info(`[repair-cleanup] merged=${merged} expired=${expired}`)
  return { merged, expired }
}
