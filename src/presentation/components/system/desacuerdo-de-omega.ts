import type { ProposalEvent } from '@domain/repair/proposal-event'

/** ADR-115 A3: lo que declaro el agente de OMEGA frente a lo que calcularon las
 *  reglas (D19). Solo se LEE para mostrarlo: el veredicto sigue siendo el de las
 *  reglas, y esto no recalcula ni cambia quien veta. */
export interface DesacuerdoDeOmega {
  readonly agentSaid: string
  readonly rulesSay: string
}

/** El desacuerdo asentado en el libro de la propuesta (run-omega-emit), o null. */
export function desacuerdoDe(events: readonly ProposalEvent[]): DesacuerdoDeOmega | null {
  const ev = events.find((e) => e.reason === 'omega_verdict_mismatch')
  if (ev?.evidenceJson === undefined) return null
  try {
    const d = JSON.parse(ev.evidenceJson) as Partial<DesacuerdoDeOmega>
    return typeof d.agentSaid === 'string' && typeof d.rulesSay === 'string'
      ? { agentSaid: d.agentSaid, rulesSay: d.rulesSay }
      : null
  } catch {
    return null
  }
}
