import type { AnalysisVerdict, Proposal, ProposalState } from '@domain/repair/proposal'

/** La fila cruda de `repair_proposals`, tal y como la devuelve SQLite. */
export interface Row {
  readonly id: string
  readonly project_id: string
  readonly finding_id: string
  readonly base_sha: string
  readonly state: string
  readonly analysis_verdict: string | null
  readonly analysis_reason: string | null
  readonly created_at: number
  readonly updated_at: number
}

/** Fila -> entidad del dominio. Las columnas nulas no viajan como propiedad. */
export function toProposal(r: Row): Proposal {
  return {
    id: r.id,
    projectId: r.project_id,
    findingId: r.finding_id,
    baseSha: r.base_sha,
    state: r.state as ProposalState,
    ...(r.analysis_verdict === null ? {} : { analysisVerdict: r.analysis_verdict as AnalysisVerdict }), // prettier-ignore
    ...(r.analysis_reason === null ? {} : { analysisReason: r.analysis_reason }),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }
}
