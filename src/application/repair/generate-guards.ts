import type { Analysis } from '@domain/repair/analysis'
import { canAffordGenerator, computeSpent } from '@domain/repair/budget'
import type { Proposal } from '@domain/repair/proposal'
import type { RejectionReason } from '@domain/repair/repair-rejection'
import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'
import type { GenerateDeps, GenerateResult } from './generate-types'
import { cursorFrom, emitOutcome, type BookCursor } from './record-generate-events'

export interface Admitted {
  readonly proposal: Proposal
  readonly project: Project
  readonly analysis: Analysis
  readonly cursor: BookCursor
  readonly spent: number
}
/** Rechaza con patch + eslabon en el libro. `detalle`: el motivo con sufijo, si lo hay. */
export async function rejectWith(
  ctx: AppContext,
  cursor: BookCursor,
  proposal: Proposal,
  reason: RejectionReason,
  evidence: object,
  now: number,
  detalle?: string
): Promise<void> {
  ctx.repairProposals.update(proposal.id, {
    state: 'RECHAZADO',
    analysisVerdict: proposal.analysisVerdict ?? 'REAL',
    analysisReason: detalle ?? reason,
    updatedAt: now
  })
  const motivo = detalle ?? reason
  await emitOutcome(ctx.eventLog, cursor, proposal.id, 'RECHAZADO', motivo, evidence, now)
}

/** Guardas de admision (a-c del flujo): estado valido, supersede (R1) y
 *  presupuesto previo (R2). Devuelve el contexto admitido o el rechazo ya
 *  persistido. Sin analisis en el libro no se genera (cadenas sinteticas). */
export async function admitProposal(
  ctx: AppContext,
  proposalId: string,
  deps: GenerateDeps,
  loadAnalysis: (events: Parameters<typeof cursorFrom>[0]) => Analysis | null
): Promise<{ failed: GenerateResult } | Admitted> {
  const proposal = ctx.repairProposals.findById(proposalId)
  if (!proposal || proposal.state !== 'ANALIZADO' || proposal.analysisVerdict !== 'REAL') {
    return { failed: { ok: false, reason: 'invalid_state' } }
  }
  const project = ctx.projects.findById(proposal.projectId)
  if (!project) return { failed: { ok: false, reason: 'invalid_state', detail: 'sin proyecto' } }

  const events = await ctx.eventLog.list(proposalId)
  const cursor = cursorFrom(events)

  const latest = ctx.repairProposals.findLatestAnalyzedRealByFinding(proposal.projectId, proposal.findingId) // prettier-ignore
  if (latest !== null && latest.id !== proposal.id) {
    const reason = `superseded_by=${latest.id.slice(0, 8)}`
    ctx.repairProposals.update(proposal.id, { state: 'CADUCADO', analysisVerdict: 'REAL', analysisReason: reason, updatedAt: deps.now() }) // prettier-ignore
    await emitOutcome(ctx.eventLog, cursor, proposal.id, 'CADUCADO', reason, { supersededBy: latest.id }, deps.now()) // prettier-ignore
    return { failed: { ok: false, reason: 'superseded', detail: reason } }
  }

  const spent = computeSpent(events)
  if (!canAffordGenerator(spent)) {
    await rejectWith(ctx, cursor, proposal, 'budget_exceeded', { spent }, deps.now())
    return { failed: { ok: false, reason: 'budget_exceeded', detail: `gastado=${spent}` } }
  }

  const analysis = loadAnalysis(events)
  if (analysis === null) {
    return { failed: { ok: false, reason: 'invalid_state', detail: 'sin analisis en el libro' } }
  }
  return { proposal, project, analysis, cursor, spent }
}
