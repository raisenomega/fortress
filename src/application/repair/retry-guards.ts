import type { FindingMemory } from '@domain/project/finding-memory'
import type { Project } from '@domain/project/project'
import type { Proposal } from '@domain/repair/proposal'
import { isRetryable } from '@domain/repair/retry-eligibility'
import type { AppContext } from '../context'

export interface RetryAdmitted {
  readonly old: Proposal
  readonly project: Project
  readonly finding: FindingMemory
}

export type RetryFailure = { readonly ok: false; readonly reason: string }

/**
 * Guardas del reintento (a-d): la vieja existe y es reintentable (D24), el
 * hallazgo sigue VIVO (un extinguido no se reintenta: no se inventa trabajo)
 * y nadie la reemplazo ya — un retry sobre lo reemplazado no aporta, y esto
 * es tambien lo que impide apilar retries sobre la misma abuela.
 */
export function admitRetry(ctx: AppContext, oldProposalId: string): RetryAdmitted | RetryFailure {
  const old = ctx.repairProposals.findById(oldProposalId)
  if (!old) return { ok: false, reason: 'unknown_proposal' }
  if (!isRetryable(old.state, old.analysisReason ?? null)) {
    return { ok: false, reason: 'not_retryable' }
  }
  const project = ctx.projects.findById(old.projectId)
  if (!project) return { ok: false, reason: 'unknown_proposal' }

  const finding = ctx.findings
    .listMemory(old.projectId)
    .find((f) => f.id === old.findingId && f.lifecycle === 'ACTIVE' && f.status === 'open')
  if (finding === undefined) return { ok: false, reason: 'finding_extinct' }

  const posterior = ctx.repairProposals
    .listByProject(old.projectId)
    .find((p) => p.findingId === old.findingId && p.createdAt > old.createdAt)
  if (posterior !== undefined) {
    return { ok: false, reason: `already_superseded_by=${posterior.id.slice(0, 8)}` }
  }
  return { old, project, finding }
}
