import { computeAllowedFiles } from '@domain/repair/allowed-files'
import { exceededBudget } from '@domain/repair/budget'
import { canTransition } from '@domain/repair/proposal'
import { buildGeneratorPrompt } from '@domain/repair/generator-prompt'
import { checkScope } from '@domain/repair/scope-check'
import { toSlug } from '@domain/repair/slug'
import type { AppContext } from '../context'
import type { GenerateDeps, GenerateResult } from './generate-types'
import { admitProposal, type Admitted } from './generate-guards'
import { makeFail, type FailFn } from './generate-fail'
import { loadAnalysis } from './load-analysis'
import { emitDecision, emitGeneratorRun, emitOutcome } from './record-generate-events'

/**
 * C3 — GENERAR: worktree aislado sobre base_sha, generador con cwd anclado,
 * commit del fix. Termina en GENERADO o RECHAZADO. NO corre gate, NO corre
 * OMEGA, NO mergea, NO toca el arbol vivo: eso es I3+.
 */
export async function generateFix(
  ctx: AppContext,
  proposalId: string,
  deps: GenerateDeps
): Promise<GenerateResult> {
  const admitted = await admitProposal(ctx, proposalId, deps, loadAnalysis)
  if ('failed' in admitted) return admitted.failed
  const a = admitted
  const worktreePath = `${deps.worktreeRoot}/${a.proposal.id}`
  const branch = `repair/${a.proposal.id.slice(0, 8)}-${toSlug(a.analysis.target.title)}`
  const fail = makeFail(ctx, deps, a, worktreePath, branch)

  const created = await deps.worktrees.create(a.proposal.baseSha, a.project.path, worktreePath, branch) // prettier-ignore
  if (!created.ok) return fail('worktree_contaminated', { error: created.error }, true)
  await emitDecision(ctx.eventLog, a.cursor, a.proposal.id, 'WORKTREE_CREATE', { worktreePath, branch, baseSha: a.proposal.baseSha, ok: true }, deps.now()) // prettier-ignore

  const sandbox = deps.sandbox(worktreePath, a.proposal.id, a.project.path)
  if (!sandbox.ok) return fail('worktree_contaminated', { error: sandbox.error }, false)
  const allowed = computeAllowedFiles(a.analysis.where)
  if (allowed.length === 0) return fail('scope_violation', { where: a.analysis.where }, false)

  const result = await deps.generator.generate(worktreePath, buildGeneratorPrompt(a.analysis))
  await emitGeneratorRun(ctx.eventLog, a.cursor, a.proposal.id, result.runMeta)
  if (!result.ok) return fail('generator_error', { error: result.error }, true)

  return verifyAndCommit(ctx, a, deps, fail, { worktreePath, allowed, cost: result.runMeta.tokensUsed ?? 0 }) // prettier-ignore
}
interface Produced {
  readonly worktreePath: string
  readonly allowed: string[]
  readonly cost: number
}

/** Post-generacion: diff real, correa de scope, presupuesto final y commit. */
async function verifyAndCommit(
  ctx: AppContext,
  a: Admitted,
  deps: GenerateDeps,
  fail: FailFn,
  p: Produced
): Promise<GenerateResult> {
  if (!(await deps.worktrees.hasChanges(p.worktreePath))) return fail('no_diff_produced', {}, false)
  const changed = await deps.worktrees.changedFiles(p.worktreePath)
  const scope = checkScope(changed, p.allowed)
  if (!scope.ok) return fail('scope_violation', { violations: scope.violations }, true)
  if (exceededBudget(a.spent, p.cost)) return fail('budget_exceeded', { spent: a.spent, cost: p.cost }, true) // prettier-ignore

  const message = `repair(${toSlug(a.analysis.target.title)}): ${a.analysis.whatToChange.slice(0, 60)}` // prettier-ignore
  const commit = await deps.worktrees.commit(p.worktreePath, message)
  if (!commit.ok) return fail('no_diff_produced', { error: commit.error }, false)

  if (!canTransition(a.proposal.state, 'GENERADO')) return fail('generator_error', { error: 'transicion invalida' }, true) // prettier-ignore
  ctx.repairProposals.update(a.proposal.id, { state: 'GENERADO', analysisVerdict: 'REAL', analysisReason: a.proposal.analysisReason ?? '', updatedAt: deps.now() }) // prettier-ignore
  const diff = await deps.worktrees.diff(p.worktreePath, a.proposal.baseSha)
  await emitOutcome(ctx.eventLog, a.cursor, a.proposal.id, 'GENERADO', 'fix generado', { commitSha: commit.sha, ...diff }, deps.now()) // prettier-ignore
  return { ok: true, proposalId: a.proposal.id, commitSha: commit.sha, files: diff.files }
}
