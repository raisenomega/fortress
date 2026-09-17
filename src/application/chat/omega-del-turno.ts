import type { DepsDelJuicio } from '../repair/juicio-de-omega'

/** El revisor que juzga lo que el turno escribio. Lo inyecta la infraestructura
 *  —es `claude -p` en lectura estricta—, igual que la red del ADR-079. */
export type OmegaDelTurno = DepsDelJuicio['omega']

/**
 * Sin revisor: lo que hay cuando nadie lo inyecta. Devuelve `noArranco`, que es
 * la verdad —el revisor no llego a existir— y no un veredicto inventado. El
 * turno entonces decide con el gate, exactamente como antes del ADR-090.
 *
 * Existe para que quien no juzga no tenga que fingir que juzga: los tests que
 * prueban OTRA cosa del turno siguen llamando sin revisor y no cambian.
 */
export const SIN_OMEGA: OmegaDelTurno = {
  run: () =>
    Promise.resolve({
      ok: false,
      error: 'sin revisor',
      timedOut: false,
      noArranco: true,
      runMeta: { durationMs: 0, startedAt: 0, endedAt: 0 }
    })
}
