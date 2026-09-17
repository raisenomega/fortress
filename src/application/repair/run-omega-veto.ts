import type { Proposal } from '@domain/repair/proposal'
import type { AppContext } from '../context'
import type { BookCursor } from './book-cursor'
import { closeOmega } from './run-omega-emit'
import type { RunOmegaResult } from './run-omega'

/**
 * Cerrar la propuesta en RECHAZADO, que es como acaban los cuatro caminos del
 * no: la corrida fallo, el presupuesto se paso, OMEGA veto, o el worktree no
 * estaba limpio. Vive aparte porque es fontaneria del Motor —toca la propuesta
 * y el libro mayor— y el juicio que la provoca ya no sabe que existe (ADR-090).
 */
export function vetoDeLaPropuesta(
  ctx: AppContext,
  cursor: BookCursor,
  proposal: Proposal,
  now: number
) {
  return async (reason: string, detail: string, evidence: object): Promise<RunOmegaResult> => {
    await closeOmega(ctx, cursor, proposal, 'RECHAZADO', reason, detail, evidence, now)
    return { ok: false, reason }
  }
}
