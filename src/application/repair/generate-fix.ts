import { buildGeneratorPrompt } from '@domain/repair/generator-prompt'
import type { AppContext } from '../context'
import type { GenerateDeps, GenerateResult } from './generate-types'
import { admitProposal } from './generate-guards'
import { prepareWorktree } from './generate-setup'
import { loadAnalysis } from './load-analysis'
import { motivoDelGenerador } from './motivo-del-generador'
import { emitGeneratorRun } from './record-generate-events'
import { conAgentRun, recordMotorRun } from './record-motor-run'
import { verifyAndCommit } from './verify-and-commit'

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
  if (!result.ok) return fail(motivoDelGenerador(result), { error: result.error }, true)

  return verifyAndCommit(ctx, a, deps, fail, { worktreePath, allowed, allows, cost: result.runMeta.tokensUsed ?? 0 }) // prettier-ignore
}
