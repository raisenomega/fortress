import type { GateOutcome } from '@domain/repair/gate-result'
import type { Proposal } from '@domain/repair/proposal'
import { rojoReanudable, type RojoReanudable } from '@domain/repair/rojo-reanudable'
import type { AppContext } from '../context'
import { type BookCursor, cursorFrom } from './book-cursor'
import { anotaciones } from './cierre-del-gate'
import { emitGateOutcome, rejectGate } from './run-gate-emit'

type Rojo = Extract<GateOutcome, { ok: false }>

/** Un rojo cuyo rechazo se APLAZA (ADR-115 B2): lleva consigo exactamente lo que
 *  el rechazo de siempre escribiria, para escribirlo identico si el lazo se rinde. */
export interface RojoAplazado extends RojoReanudable {
  readonly reason: Rojo['reason']
  readonly detail: string
  readonly evidence: object
}

export type CierreDelRojo = { ok: false; reason: string; aplazado?: RojoAplazado }

/** El rojo del gate: se rechaza como siempre, salvo que se pida aplazar Y sea un
 *  rojo de codigo reanudable. Entonces la propuesta se queda en GENERADO. */
export function cerrarElRojo(
  ctx: AppContext,
  cursor: BookCursor,
  proposal: Proposal,
  outcome: Rojo,
  now: number,
  aplazar: boolean
): Promise<CierreDelRojo> {
  const detail = `gate_failed_at=${outcome.failedAt}`
  const roto = outcome.commands.at(-1)
  const evidence = { failedAt: outcome.failedAt, reason: outcome.reason, exitCode: roto?.exitCode, timedOut: roto?.timedOut, ...anotaciones(outcome) } // prettier-ignore
  if (outcome.reason === 'gate_detenido') return caducarDetenido(ctx, cursor, proposal, outcome, evidence, now) // prettier-ignore
  const reanudable = aplazar ? rojoReanudable(outcome) : null
  if (reanudable === null) return rejectGate(ctx, cursor, proposal, outcome.reason, detail, evidence, now) // prettier-ignore
  return Promise.resolve({ ok: false, reason: outcome.reason, aplazado: { ...reanudable, reason: outcome.reason, detail, evidence } }) // prettier-ignore
}

/** Un comando del gate murio por una senal (Detener): el fix no se juzgo. La
 *  propuesta CADUCA —ni RECHAZADA por un rojo que no existio, ni en el freno de
 *  B1—, con el veredicto intacto para que el hallazgo vuelva a la baraja. */
async function caducarDetenido(
  ctx: AppContext,
  cursor: BookCursor,
  proposal: Proposal,
  outcome: Rojo,
  evidence: object,
  now: number
): Promise<CierreDelRojo> {
  const roto = outcome.commands.at(-1)
  const detail = `gate_detenido: ${outcome.failedAt} por ${roto?.senal ?? 'una senal'}`
  ctx.repairProposals.update(proposal.id, { state: 'CADUCADO', analysisVerdict: proposal.analysisVerdict ?? 'REAL', analysisReason: detail, updatedAt: now }) // prettier-ignore
  await emitGateOutcome(ctx.eventLog, cursor, proposal.id, 'CADUCADO', detail, { ...evidence, senal: roto?.senal }, now) // prettier-ignore
  return { ok: false, reason: outcome.reason }
}

/** El rechazo aplazado, cuando el lazo no da (o no puede dar) la vuelta. Solo
 *  desde GENERADO: un RECHAZADO no se reabre ni se reescribe. */
export async function rechazarAplazado(
  ctx: AppContext,
  proposalId: string,
  a: RojoAplazado,
  now: number
): Promise<{ ok: false; reason: string }> {
  const proposal = ctx.repairProposals.findById(proposalId)
  if (!proposal || proposal.state !== 'GENERADO') return { ok: false, reason: 'invalid_state' }
  const cursor = cursorFrom(await ctx.eventLog.list(proposalId))
  return rejectGate(ctx, cursor, proposal, a.reason, a.detail, a.evidence, now)
}
