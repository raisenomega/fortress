import { canTransition, type Proposal, type ProposalState } from '@domain/repair/proposal'
import { buildTransitionEvent, type EventPhase } from '@domain/repair/proposal-event'
import type { AppContext } from '../context'
import { next, safeRecord, type BookCursor } from './book-cursor'

const FASE: Readonly<Record<string, EventPhase>> = {
  APROBADO: 'APPROVE',
  MERGEADO: 'MERGE',
  CADUCADO: 'EXPIRE'
}

/**
 * Recorre un camino de estados ya decidido, un salto por vez, y asienta cada
 * uno. `canTransition` sigue siendo el unico juez: si un salto no es legal se
 * para ahi, y lo ya andado queda escrito — nunca se fuerza el resto ni se
 * revierte lo anterior, porque cada salto ya tiene su asiento en el libro.
 *
 * Escribe `analysisVerdict` y `analysisReason` porque `ProposalPatch` los
 * EXIGE, no porque estos caminos los produzcan: el veredicto se conserva tal
 * cual estaba y la razon es la del movimiento.
 */
export async function advanceProposal(
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
