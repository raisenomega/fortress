import { isActionable } from '@domain/repair/analysis'
import { buildTransitionEvent } from '@domain/repair/proposal-event'
import {
  canTransition,
  type AnalysisVerdict,
  type Proposal,
  type ProposalState
} from '@domain/repair/proposal'
import type { Selection } from '@domain/repair/select-target'
import { newId } from '@domain/shared/id'
import type { AppContext } from '../context'
import { analyzeTarget } from './analyze-target'
import { safeRecord } from './book-cursor'
import { recordAnalyzed } from './record-plan-events'
import { admitRetry } from './retry-guards'

export type RetryResult =
  | { readonly ok: true; readonly newProposalId: string }
  | { readonly ok: false; readonly reason: string }

/** seq 1 del reintento: nace ELEGIDO con el linaje completo como evidencia. */
function recordRetryElegido(ctx: AppContext, proposal: Proposal, oldId: string): Promise<void> {
  return safeRecord(
    ctx.eventLog,
    buildTransitionEvent({
      proposalId: proposal.id, seq: 1, phase: 'SELECT', toState: 'ELEGIDO',
      reason: proposal.analysisReason, ts: proposal.createdAt,
      evidenceJson: JSON.stringify({
        findingId: proposal.findingId, retry_of: oldId, baseSha: proposal.baseSha, source: 'retry'
      })
    }) // prettier-ignore
  )
}

/**
 * I4.2 — reintento EXPLICITO de un rechazo de razonamiento (D24): propuesta
 * NUEVA sobre el HEAD actual, trazable por "retry_of=<vieja_8>" y con C2
 * FRESCO (D26 — el analisis viejo no se cachea). La vieja no se muta: es
 * historia. Un C2 que dictamine OBSOLETO caduca la nueva — final valido.
 */
export async function retryRepair(ctx: AppContext, oldProposalId: string): Promise<RetryResult> {
  const admitted = admitRetry(ctx, oldProposalId)
  if ('reason' in admitted) return admitted
  const { old, project, finding } = admitted
  const baseSha = ctx.headSha(project.path)
  if (baseSha === null) return { ok: false, reason: 'no_git_head' }

  const now = Date.now()
  const retryOf = `retry_of=${old.id.slice(0, 8)}`
  const proposal: Proposal = {
    id: newId(), projectId: old.projectId, findingId: old.findingId, baseSha,
    state: 'ELEGIDO', analysisReason: retryOf, createdAt: now, updatedAt: now
  } // prettier-ignore
  ctx.repairProposals.insert(proposal)
  await recordRetryElegido(ctx, proposal, old.id)

  const { id, severity, title, file, line, firstSeen } = finding
  const selection: Selection = {
    target: { id, severity, title, file, line, firstSeen },
    reason: `${retryOf} — reintento explicito del operador sobre el mismo hallazgo`
  }
  const result = await analyzeTarget(ctx.analystFor(project.path, project.id), selection)
  const verdict: AnalysisVerdict = isActionable(result.analysis) ? 'REAL' : 'OBSOLETO'
  const state: ProposalState = verdict === 'REAL' ? 'ANALIZADO' : 'CADUCADO'
  if (!canTransition(proposal.state, state)) return { ok: true, newProposalId: proposal.id }
  ctx.repairProposals.update(proposal.id, {
    state, analysisVerdict: verdict,
    analysisReason: `${retryOf}; ${result.analysis.risk}`, updatedAt: Date.now()
  }) // prettier-ignore
  await recordAnalyzed(ctx.eventLog, proposal, result, state)
  return { ok: true, newProposalId: proposal.id }
}
