import type { AnalysisVerdict, Proposal, ProposalState } from '@domain/repair/proposal'
import type { ProposalPatch, RepairProposalRepository } from '@domain/repair/proposal-repository'
import type { Db } from './database'

const COLS = 'id, project_id, finding_id, base_sha, state, analysis_verdict, analysis_reason, created_at, updated_at' // prettier-ignore

/** La propuesta mas reciente de cada hallazgo quedo OBSOLETA bajo ese escaneo. */
const OBSOLETOS = `SELECT p.finding_id FROM repair_proposals p
  JOIN findings f ON f.id = p.finding_id AND f.scan_id = @scanId
  WHERE p.project_id = @projectId AND p.state = 'CADUCADO'
    AND p.analysis_verdict = 'OBSOLETO'
    AND p.created_at = (SELECT MAX(q.created_at) FROM repair_proposals q
                        WHERE q.finding_id = p.finding_id)`

interface Row {
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

function toProposal(r: Row): Proposal {
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

/** Consultas parametrizadas siempre: nunca se concatena input. */
export function createSqliteRepairProposalRepository(db: Db): RepairProposalRepository {
  const insert = db.prepare(`INSERT INTO repair_proposals (${COLS})
    VALUES (@id, @projectId, @findingId, @baseSha, @state, NULL, NULL, @createdAt, @updatedAt)`)
  const update = db.prepare(`UPDATE repair_proposals SET state = @state,
    analysis_verdict = @verdict, analysis_reason = @reason, updated_at = @updatedAt
    WHERE id = @id`)
  const byId = db.prepare(`SELECT ${COLS} FROM repair_proposals WHERE id = ?`)
  const byProject = db.prepare(
    `SELECT ${COLS} FROM repair_proposals WHERE project_id = ? ORDER BY updated_at DESC`
  )
  const obsoletos = db.prepare(OBSOLETOS)

  return {
    insert: (p) => void insert.run(p),
    update: (id, patch: ProposalPatch) =>
      void update.run({
        id,
        state: patch.state,
        verdict: patch.analysisVerdict,
        reason: patch.analysisReason,
        updatedAt: patch.updatedAt
      }),
    findById: (id) => {
      const row = byId.get(id) as Row | undefined
      return row === undefined ? null : toProposal(row)
    },
    listByProject: (projectId) => (byProject.all(projectId) as Row[]).map(toProposal),
    findObsoleteFindingIds: (projectId, currentScanId) =>
      (obsoletos.all({ projectId, scanId: currentScanId }) as Row[]).map((r) => r.finding_id)
  }
}
