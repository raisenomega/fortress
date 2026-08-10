import type { AnalysisVerdict, Proposal, ProposalState } from './proposal'

/** Lo que una transicion escribe sobre la propuesta. */
export interface ProposalPatch {
  readonly state: ProposalState
  readonly analysisVerdict: AnalysisVerdict
  readonly analysisReason: string
  readonly updatedAt: number
}

/** Puerto del expediente de propuestas. Infra lo implementa sobre SQLite. */
export interface RepairProposalRepository {
  insert(proposal: Proposal): void
  update(id: string, patch: ProposalPatch): void
  findById(id: string): Proposal | null
  /** Del mas reciente al mas antiguo (por updated_at). */
  listByProject(projectId: string): readonly Proposal[]
  /**
   * Hallazgos que NO deben re-proponerse bajo el escaneo vigente: su propuesta
   * mas reciente quedo CADUCADO con veredicto OBSOLETO y el hallazgo sigue
   * anclado a ese mismo escaneo. Un escaneo nuevo levanta la exclusion.
   */
  findObsoleteFindingIds(projectId: string, currentScanId: string): readonly string[]
  /** R1 (supersede): la ANALIZADO(REAL) mas reciente de ese hallazgo, o null. */
  findLatestAnalyzedRealByFinding(projectId: string, findingId: string): Proposal | null
}
