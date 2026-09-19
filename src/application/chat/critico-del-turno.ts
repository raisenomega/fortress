import type { TribunalDeps } from './tribunal-con-critico'

/** El critico que ataca lo que el turno escribio. Lo inyecta la infraestructura
 *  —es `claude -p` navegando el repo—, igual que OMEGA y la red del ADR-079. */
export type CriticoDelTurno = TribunalDeps['critico']

/**
 * Sin critico: lo que hay cuando nadie lo inyecta. El turno se comporta como en
 * la Fase A —solo OMEGA— sin que nada finja un debate que no ocurrio.
 *
 * Gemelo de `SIN_OMEGA`, y por lo mismo: los tests que prueban OTRA cosa del
 * turno siguen llamando sin critico y no cambian.
 */
export const SIN_CRITICO: CriticoDelTurno = {
  run: () =>
    Promise.resolve({
      ok: false,
      error: 'sin critico',
      timedOut: false,
      runMeta: { durationMs: 0, startedAt: 0, endedAt: 0 }
    })
}
