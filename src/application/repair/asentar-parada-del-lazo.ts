import { buildTransitionEvent } from '@domain/repair/proposal-event'
import { dejaRecibo, MOTIVO_PARADA_DEL_LAZO } from '@domain/repair/recibo-del-lazo'
import type { AppContext } from '../context'
import { cursorFrom, next, safeRecord } from './book-cursor'
import type { DesenlaceDelLazo } from './desenlace-del-lazo'

/**
 * El recibo del lazo (DEUDAS §15.2): un asiento DECISION, aditivo y sin
 * migracion, con el patron de `MOTIVO_HUELLA`. El MOTOR lo escribe (ADR-047),
 * en la fase OMEGA porque ahi vive la decision —el lazo decide sobre el
 * veredicto que el revisor acaba de dar—. `evidence` lleva la parada y las
 * vueltas que SI se dieron: «convergio tras 1» y «sin-sesion tras 0» dejan de
 * ser el mismo silencio. Telemetria, no gate: `safeRecord` nunca corta.
 */
export async function asentarParadaDelLazo(
  ctx: AppContext,
  proposalId: string,
  lazo: Pick<DesenlaceDelLazo, 'parada' | 'vueltas'>,
  ts = Date.now()
): Promise<void> {
  if (!dejaRecibo(lazo.parada)) return
  const cursor = cursorFrom(await ctx.eventLog.list(proposalId))
  const estado = ctx.repairProposals.findById(proposalId)?.state ?? 'OMEGA'
  const base = buildTransitionEvent({
    proposalId, seq: next(cursor), phase: 'OMEGA', toState: estado, reason: MOTIVO_PARADA_DEL_LAZO,
    evidenceJson: JSON.stringify({ parada: lazo.parada, vueltas: lazo.vueltas }), ts
  }) // prettier-ignore
  await safeRecord(ctx.eventLog, { ...base, eventType: 'DECISION' })
}
