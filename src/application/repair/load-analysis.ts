import type { Analysis } from '@domain/repair/analysis'
import type { ProposalEvent } from '@domain/repair/proposal-event'

/**
 * El Analysis completo de C2 no vive en repair_proposals: vive en el LIBRO,
 * como evidenceJson del TRANSITION que causo el veredicto. Se toma el mas
 * reciente que parsee como analisis; una cadena sintetica (backfill) no lo
 * tiene y devuelve null — sin entendimiento no se genera.
 */
export function loadAnalysis(events: readonly ProposalEvent[]): Analysis | null {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i]
    if (event.eventType !== 'TRANSITION' || event.evidenceJson === undefined) continue
    try {
      const parsed = JSON.parse(event.evidenceJson) as Partial<Analysis>
      if (
        typeof parsed.where === 'string' &&
        typeof parsed.whatToChange === 'string' &&
        parsed.target !== undefined
      ) {
        return parsed as Analysis
      }
    } catch {
      continue
    }
  }
  return null
}
