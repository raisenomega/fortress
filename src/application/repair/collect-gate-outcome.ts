import type { CommandOutcome, GateOutcome } from '@domain/repair/gate-result'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import { comando, textos } from './lectura-del-gate'

/**
 * Los comandos de LA VUELTA de ese cierre, y no todos los del libro.
 *
 * Desde el lazo (ADR-110) una propuesta puede tener DOS gates, y esto tomaba
 * TODOS los `AGENT_RUN` de fase GATE con el PRIMER cierre que encontraba: el
 * expediente que el operador firma habria descrito la vuelta 1 con los comandos
 * de las dos mezclados. Es la clase de DEUDAS §13 —leer por posicion— y la
 * arista es lo que la convierte en defecto real.
 *
 * La frontera de una vuelta es su cierre: sus comandos son los que caen DESPUES
 * del cierre anterior y ANTES del suyo. Con una sola vuelta, la ventana es el
 * libro entero y el resultado es identico al de siempre.
 */
function comandosDeLaVuelta(
  delGate: readonly ProposalEvent[],
  cierre: ProposalEvent
): readonly CommandOutcome[] {
  const anteriores = delGate.filter((e) => e.eventType === 'TRANSITION' && e.seq < cierre.seq)
  const desde = anteriores.length === 0 ? -Infinity : Math.max(...anteriores.map((e) => e.seq))
  return delGate
    .filter((e) => e.eventType === 'AGENT_RUN' && e.seq > desde && e.seq < cierre.seq)
    .map(comando)
    .filter((c): c is CommandOutcome => c !== null)
}

/**
 * El gate NO persiste un GateOutcome: emite un AGENT_RUN por comando y una
 * TRANSITION al cerrar; el juicio se REUNE de esos dos rastros.
 *
 * El cierre que vale es el ULTIMO: con el lazo, el veredicto del gate que el
 * operador firma es el de la vuelta que se integra, no el de la primera.
 */
export function collectGateOutcome(events: readonly ProposalEvent[]): GateOutcome | null {
  const delGate = events.filter((e) => e.phase === 'GATE')
  const cierres = delGate.filter((e) => e.eventType === 'TRANSITION')
  const cierre = cierres.at(-1)
  if (cierre === undefined) return null

  const commands = comandosDeLaVuelta(delGate, cierre)
  if (commands.length === 0) return null

  const skipped = textos(cierre, 'skipped')
  const heredado = textos(cierre, 'heredado')
  const salto = { ...(skipped ? { skipped } : {}), ...(heredado ? { heredado } : {}) }

  // El veredicto lo dice el cierre, no se recalcula: quien juzgo ya decidio.
  if (cierre.toState === 'GATE') return { ok: true, commands, ...salto }

  const roto = commands.find((c) => c.exitCode !== 0)
  return {
    ok: false,
    commands,
    failedAt: roto?.command ?? String(cierre.reason ?? 'desconocido'),
    reason: roto?.timedOut === true ? 'gate_timeout' : 'gate_failed',
    ...salto
  }
}
