import type { CommandOutcome, GateOutcome } from '@domain/repair/gate-result'
import type { ProposalEvent } from '@domain/repair/proposal-event'

interface RawCommand {
  readonly command?: unknown
  readonly exitCode?: unknown
  readonly stdoutTail?: unknown
  readonly stderrTail?: unknown
  readonly timedOut?: unknown
}

/** El evidenceJson de un AGENT_RUN del gate, o null si no parsea o no es uno. */
function comando(event: ProposalEvent): CommandOutcome | null {
  if (event.evidenceJson === undefined) return null
  try {
    const raw = JSON.parse(event.evidenceJson) as RawCommand
    if (typeof raw.command !== 'string' || typeof raw.exitCode !== 'number') return null
    return {
      command: raw.command,
      exitCode: raw.exitCode,
      // El tiempo vive en el evento, no en la evidencia: el que lo emite ya lo sabe.
      durationMs: event.durationMs ?? 0,
      stdoutTail: typeof raw.stdoutTail === 'string' ? raw.stdoutTail : '',
      stderrTail: typeof raw.stderrTail === 'string' ? raw.stderrTail : '',
      timedOut: raw.timedOut === true
    }
  } catch {
    return null
  }
}

/** Una lista de textos del cierre, si el cierre la cuenta. Ausente significa
 *  que ese asiento no la contaba, no que estuviera vacia. */
function textos(event: ProposalEvent, clave: string): readonly string[] | undefined {
  if (event.evidenceJson === undefined) return undefined
  try {
    const raw = JSON.parse(event.evidenceJson) as Record<string, unknown>
    const lista = Array.isArray(raw[clave]) ? (raw[clave] as unknown[]) : null
    return lista?.every((s) => typeof s === 'string') === true ? (lista as string[]) : undefined
  } catch {
    return undefined
  }
}

/**
 * El gate NO persiste un GateOutcome: emite un AGENT_RUN por comando y una
 * TRANSITION al cerrar; el juicio se REUNE de esos dos rastros.
 */
export function collectGateOutcome(events: readonly ProposalEvent[]): GateOutcome | null {
  const delGate = events.filter((e) => e.phase === 'GATE')
  const cierre = delGate.find((e) => e.eventType === 'TRANSITION')
  if (cierre === undefined) return null

  const commands = delGate
    .filter((e) => e.eventType === 'AGENT_RUN')
    .map(comando)
    .filter((c): c is CommandOutcome => c !== null)
  if (commands.length === 0) return null

  const skipped = textos(cierre, 'skipped')
  const heredado = textos(cierre, 'heredado')
  const salto = { ...(skipped ? { skipped } : {}), ...(heredado ? { heredado } : {}) }

  // El veredicto lo dice el cierre, no se recalcula: quien juzgo ya decidio.
  if (cierre.toState === 'GATE') return { ok: true, commands, ...(skipped ? { skipped } : {}) }

  const roto = commands.find((c) => c.exitCode !== 0)
  return {
    ok: false,
    commands,
    failedAt: roto?.command ?? String(cierre.reason ?? 'desconocido'),
    reason: roto?.timedOut === true ? 'gate_timeout' : 'gate_failed',
    ...salto
  }
}
