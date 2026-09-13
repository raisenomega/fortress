import { canTransition, type Proposal, type ProposalState } from '@domain/repair/proposal'
import { notaDeIntegracion } from '@domain/repair/nota-de-integracion'
import { buildTransitionEvent, type EventPhase } from '@domain/repair/proposal-event'
import type { AppContext } from '../context'
import { next, safeRecord, type BookCursor } from './book-cursor'

const FASE: Readonly<Record<string, EventPhase>> = {
  APROBADO: 'APPROVE',
  MERGEADO: 'MERGE',
  CADUCADO: 'EXPIRE'
}

/**
 * El hallazgo que este fix arreglaba, marcado cuando el fix ENTRA (ADR-087).
 *
 * Hasta aqui integrar no tocaba la fila: el motor proponia, OMEGA revisaba, el
 * operador firmaba, el merge entraba — y el hallazgo seguia ACTIVE, contando
 * para el score y pidiendole trabajo al motor otra vez. Lo marcaba el operador
 * a mano, hallazgo por hallazgo.
 *
 * VIVE AQUI y no en `applyAutoMerge` por dos razones, y la segunda pesa mas que
 * la primera. Aquel fichero es INNEGOCIABLE —es donde se invoca el alcance—; y
 * este punto es donde convergen las TRES vias que llegan a MERGEADO: la firma,
 * la integracion automatica, y el reconciliador de huerfanos, que detecta un
 * merge que entro sin que su propuesta llegara a enterarse. Marcar en el merge
 * habria dejado la tercera fuera.
 *
 * MEJOR ESFUERZO, y no por descuido: cuando esto corre el fix YA ESTA EN EL
 * REPO. Una escritura que fallara no puede tumbar una integracion consumada, ni
 * impedir que el resto del camino se asiente. Y el `false` —la fila ya no esta
 * ACTIVE porque el operador la marco antes, o porque un juicio la extinguio— es
 * el caso NORMAL, no un error: se ignora.
 */
function marcarElHallazgoIntegrado(
  ctx: AppContext,
  proposal: Proposal,
  reason: string,
  now: number
): void {
  try {
    ctx.findings.markMitigated(proposal.findingId, notaDeIntegracion(reason), new Date(now).toISOString()) // prettier-ignore
  } catch (error) {
    console.error('[motor] el fix entro pero no se pudo marcar el hallazgo', proposal.findingId, error) // prettier-ignore
  }
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
    // Solo MERGEADO, y solo despues de que el salto se escribiera: un camino
    // que se para a medias no integro nada, y CADUCADO menos todavia.
    if (to === 'MERGEADO') marcarElHallazgoIntegrado(ctx, proposal, reason, now)
    from = to
  }
}
