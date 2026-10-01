import type { ProposalEvent } from '@domain/repair/proposal-event'

/**
 * El ultimo evento de una fase y tipo, o undefined. El mas reciente manda.
 *
 * `motivo` acota la busqueda al asiento que SE BUSCA, y no es un lujo: el
 * `GENERATE DECISION` que lleva `branch` y `baseSha` es el del worktree, y desde
 * el 28-sep hay otros DECISION detras —la correa y la huella—. Buscar «el
 * ultimo» cogia uno de esos y el expediente salia incompleto (DEUDAS §13).
 */
export function ultimo(
  events: readonly ProposalEvent[],
  phase: string,
  type: string,
  motivo?: string
): unknown {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const e = events[i]
    if (e.phase !== phase || e.eventType !== type || e.evidenceJson === undefined) continue
    if (motivo !== undefined && e.reason !== motivo) continue
    try {
      return JSON.parse(e.evidenceJson)
    } catch {
      continue
    }
  }
  return undefined
}

export const texto = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null)
export const numero = (v: unknown): number | null => (typeof v === 'number' ? v : null)
