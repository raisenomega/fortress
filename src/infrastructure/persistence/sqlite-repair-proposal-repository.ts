import { TERMINAL_STATES } from '@domain/repair/proposal'
import type { ProposalPatch, RepairProposalRepository } from '@domain/repair/proposal-repository'
import type { Db } from './database'
import { toProposal, type Row } from './repair-proposal-row'
import { COLS, LATEST_ANALYZED_REAL, liveFindingIds, liveProposals, OBSOLETOS } from './repair-proposal-sql' // prettier-ignore

/** Consultas parametrizadas siempre: nunca se concatena input. */
export function createSqliteRepairProposalRepository(db: Db): RepairProposalRepository {
  // analysis_reason SI se persiste al nacer (I4.2: "retry_of=<id>" viaja ahi).
  const insert = db.prepare(`INSERT INTO repair_proposals (${COLS})
    VALUES (@id, @projectId, @findingId, @baseSha, @state, NULL, @analysisReason, @createdAt, @updatedAt)`)
  const update = db.prepare(`UPDATE repair_proposals SET state = @state,
    analysis_verdict = @verdict, analysis_reason = @reason, updated_at = @updatedAt
    WHERE id = @id`)
  const byId = db.prepare(`SELECT ${COLS} FROM repair_proposals WHERE id = ?`)
  const byProject = db.prepare(
    `SELECT ${COLS} FROM repair_proposals WHERE project_id = ? ORDER BY updated_at DESC`
  )
  const obsoletos = db.prepare(OBSOLETOS)
  const vivas = db.prepare(liveFindingIds(TERMINAL_STATES))
  const propuestasVivas = db.prepare(liveProposals(TERMINAL_STATES))
  const latestReal = db.prepare(LATEST_ANALYZED_REAL)

  return {
    insert: (p) =>
      void insert.run({
        id: p.id, projectId: p.projectId, findingId: p.findingId, baseSha: p.baseSha,
        state: p.state, analysisReason: p.analysisReason ?? null,
        createdAt: p.createdAt, updatedAt: p.updatedAt
      }), // prettier-ignore
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
      (obsoletos.all({ projectId, scanId: currentScanId }) as Row[]).map((r) => r.finding_id),
    findLiveFindingIds: (projectId) =>
      (vivas.all(projectId, ...TERMINAL_STATES) as Row[]).map((r) => r.finding_id),
    listLive: () => (propuestasVivas.all(...TERMINAL_STATES) as Row[]).map(toProposal),
    findLatestAnalyzedRealByFinding: (projectId, findingId) => {
      const row = latestReal.get({ projectId, findingId }) as Row | undefined
      return row === undefined ? null : toProposal(row)
    }
  }
}
