import { redactSecrets } from '@domain/chat/tool-detail'
import type { AnalystResult } from '@domain/repair/analysis'
import type { Proposal } from '@domain/repair/proposal'
import type { Veredicto } from '@domain/repair/veredicto-del-analisis'
import {
  buildAgentRunEvent,
  buildTransitionEvent,
  type ProposalEvent
} from '@domain/repair/proposal-event'
import type { ProposalEventLog } from './proposal-event-log'

/**
 * La emision es TELEMETRIA, no gate: se asienta DESPUES de confirmar cada
 * escritura de estado y jamas la revierte. Si el libro falla, se anota en
 * consola (no hay logger central en el main) y la reparacion sigue su curso.
 */
async function safeRecord(log: ProposalEventLog, event: ProposalEvent): Promise<void> {
  try {
    await log.record(event)
  } catch (error) {
    console.error('proposal_events: fallo al asentar un evento', error)
  }
}

/** seq 1 — C1 eligio y la propuesta nacio en ELEGIDO. */
export function recordElegido(
  log: ProposalEventLog,
  proposal: Proposal,
  scanId: string
): Promise<void> {
  return safeRecord(
    log,
    buildTransitionEvent({
      proposalId: proposal.id, seq: 1, phase: 'SELECT', toState: 'ELEGIDO',
      scanId, ts: proposal.createdAt
    }) // prettier-ignore
  )
}

/**
 * seq 2 y 3 — la corrida del analista y la transicion que su veredicto causo.
 *
 * La fase la manda el estado: solo CADUCADO es EXPIRE. Un analisis ilegible
 * acaba en RECHAZADO y se asienta en ANALYZE, que es donde fallo — archivarlo
 * bajo EXPIRE seria repetir en la fase la misma mentira que en el estado.
 */
export async function recordAnalyzed(
  log: ProposalEventLog,
  proposal: Proposal,
  result: AnalystResult,
  veredicto: Veredicto
): Promise<void> {
  const { analysis, runMeta, raw } = result
  const corrida = buildAgentRunEvent({
    proposalId: proposal.id, seq: 2, phase: 'ANALYZE', actor: 'claude-analyst',
    agentRunId: runMeta.agentRunId, costTokens: runMeta.tokensUsed,
    durationMs: runMeta.durationMs, ts: runMeta.endedAt
  }) // prettier-ignore
  // El crudo ENTERO por el mismo canal que la autopsia de OMEGA: la evidencia
  // del evento de la corrida. La razon del asiento sigue siendo la muestra.
  // REDACTADO: es la salida literal de un `claude` con la API key en su entorno,
  // y esto va a la base para siempre. Lo efimero se redactaba y lo PERMANENTE no.
  const evidenceJson = raw === undefined ? undefined : JSON.stringify({ raw: redactSecrets(raw) })
  await safeRecord(log, evidenceJson === undefined ? corrida : { ...corrida, evidenceJson })
  // El gemelo del crudo: se tacha cada CAMPO de texto, nunca el JSON ya montado.
  await safeRecord(
    log,
    buildTransitionEvent({
      proposalId: proposal.id, seq: 3, phase: veredicto.state === 'CADUCADO' ? 'EXPIRE' : 'ANALYZE',
      fromState: 'ELEGIDO', toState: veredicto.state, reason: redactSecrets(veredicto.reason),
      evidenceJson: JSON.stringify(analysis, (_k, v: unknown) => (typeof v === 'string' ? redactSecrets(v) : v)),
      ts: Date.now()
    }) // prettier-ignore
  )
}
