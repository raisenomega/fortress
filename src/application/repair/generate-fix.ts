import { exceededBudget } from '@domain/repair/budget'
import { canTransition } from '@domain/repair/proposal'
import { buildGeneratorPrompt } from '@domain/repair/generator-prompt'
import { checkScope } from '@domain/repair/scope-check'
import { toSlug } from '@domain/repair/slug'
import type { AppContext } from '../context'
import type { GenerateDeps, GenerateResult, Produced } from './generate-types'
import { admitProposal, type Admitted } from './generate-guards'
import type { FailFn } from './generate-fail'
import { prepareWorktree } from './generate-setup'
import { loadAnalysis } from './load-analysis'
import { emitGeneratorRun, emitOutcome } from './record-generate-events'
import { conAgentRun, recordMotorRun } from './record-motor-run'

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

  const prepared = await prepareWorktree(ctx, a, deps)
  if ('failed' in prepared) return prepared.failed
  const { worktreePath, allowed, allows, fail } = prepared

  // Al generador se le dice EXACTAMENTE lo que el juez le va a exigir: los dos
  // salen de `prepared`, no de dos calculos que podrian separarse con el tiempo.
  const prompt = buildGeneratorPrompt(a.analysis, ctx.corpus.of(a.project.path), allowed, allows)
  const crudo = await deps.generator.generate(worktreePath, prompt)
  // Registrar ANTES de asentar: el id nace en el libro mayor y el asiento lo
  // cita. Al reves —como estaba— el asiento se escribia cuando ese id todavia
  // no existia, y la cita quedaba vacia para siempre.
  const result = conAgentRun(crudo, recordMotorRun(ctx, a.proposal.projectId, null, crudo.runMeta, !crudo.ok)) // prettier-ignore
  await emitGeneratorRun(ctx.eventLog, a.cursor, a.proposal.id, result.runMeta)
  // CONSERVADO para autopsia: fallo con cambios posiblemente parciales.
  if (!result.ok) return fail(result.turnosAgotados ? 'turnos_agotados' : 'generator_error', { error: result.error }, true) // prettier-ignore

  return verifyAndCommit(ctx, a, deps, fail, { worktreePath, allowed, allows, cost: result.runMeta.tokensUsed ?? 0 }) // prettier-ignore
}

/** Post-generacion: diff real, correa de scope, presupuesto final y commit. */
async function verifyAndCommit(
  ctx: AppContext,
  a: Admitted,
  deps: GenerateDeps,
  fail: FailFn,
  p: Produced
): Promise<GenerateResult> {
  // Se limpia: termino sin diff, no hay nada que preservar.
  if (!(await deps.worktrees.hasChanges(p.worktreePath))) return fail('no_diff_produced', {}, false)
  const changed = await deps.worktrees.changedFiles(p.worktreePath)
  const scope = checkScope(changed, p.allowed, p.allows)
  // CONSERVADO para autopsia: el generador produjo cambios FUERA de scope.
  if (!scope.ok) return fail('scope_violation', { violations: scope.violations }, true)
  // CONSERVADO: el commit del fix existiria pero el coste excedio; autopsia posible.
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
