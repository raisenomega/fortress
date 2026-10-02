import type { CommandOutcome } from '@domain/repair/gate-result'
import type { ProposalEvent } from '@domain/repair/proposal-event'

interface RawCommand {
  readonly command?: unknown
  readonly exitCode?: unknown
  readonly stdoutTail?: unknown
  readonly stderrTail?: unknown
  readonly timedOut?: unknown
}

/** El evidenceJson de un AGENT_RUN del gate, o null si no parsea o no es uno. */
export function comando(event: ProposalEvent): CommandOutcome | null {
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
export function textos(event: ProposalEvent, clave: string): readonly string[] | undefined {
  if (event.evidenceJson === undefined) return undefined
  try {
    const raw = JSON.parse(event.evidenceJson) as Record<string, unknown>
    const lista = Array.isArray(raw[clave]) ? (raw[clave] as unknown[]) : null
    return lista?.every((s) => typeof s === 'string') === true ? (lista as string[]) : undefined
  } catch {
    return undefined
  }
}
