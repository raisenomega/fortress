import type { Analysis } from '@domain/repair/analysis'
import { exceededBudget } from '@domain/repair/budget'
import { buildOmegaPrompt } from '@domain/repair/omega-prompt'
import { computeGlobalVerdict } from '@domain/repair/omega-verdict'
import type { Proposal } from '@domain/repair/proposal'
import type { AppContext } from '../context'
import type { BookCursor } from './book-cursor'
import { buildOmegaInput } from './run-omega-inputs'
import { closeOmega, emitOmegaMismatch, emitOmegaRun } from './run-omega-emit'
import type { OmegaDeps, RunOmegaResult } from './run-omega'
import { conAgentRun, recordMotorRun } from './record-motor-run'

/** El juicio en si, ya dentro de la cola: inputs -> agente -> veredicto. */
export async function judgeProposal(
  ctx: AppContext,
  proposal: Proposal,
  analysis: Analysis,
  cursor: BookCursor,
  spent: number,
  worktreePath: string,
  deps: OmegaDeps
): Promise<RunOmegaResult> {
  const veto = async (
    reason: string,
    detail: string,
    evidence: object
  ): Promise<RunOmegaResult> => {
    // prettier-ignore
    await closeOmega(ctx, cursor, proposal, 'RECHAZADO', reason, detail, evidence, deps.now())
    return { ok: false, reason }
  }

  const { input, files } = await buildOmegaInput(deps, worktreePath, proposal.baseSha, analysis)
  const crudo = await deps.omega.run(worktreePath, buildOmegaPrompt(input))
  const evidence = crudo.ok ? { verdict: crudo.verdict, diffFiles: files } : { error: crudo.error, diffFiles: files } // prettier-ignore
  // Igual que en generate: el id existe antes de que el asiento lo cite.
  const result = conAgentRun(crudo, recordMotorRun(ctx, proposal.projectId, 'sentinel-omega', crudo.runMeta, !crudo.ok)) // prettier-ignore
  await emitOmegaRun(ctx, cursor, proposal.id, result.runMeta, evidence)

  if (!result.ok) {
    const reason = result.error === 'omega_response_invalid' ? 'omega_response_invalid' : result.timedOut ? 'omega_timeout' : 'omega_error' // prettier-ignore
    return veto(reason, reason, { error: result.error })
  }
  // D19 — el motor recomputa: los ejes son evidencia, la regla es codigo.
  const computed = computeGlobalVerdict(result.verdict)
  if (computed !== result.verdict.veredicto_global) {
    await emitOmegaMismatch(ctx, cursor, proposal.id, result.verdict.veredicto_global, computed, deps.now()) // prettier-ignore
  }
  if (exceededBudget(spent, result.runMeta.tokensUsed ?? 0)) {
    return veto('budget_exceeded', 'budget_exceeded', { spent, cost: result.runMeta.tokensUsed })
  }
  if (computed === 'VETADO') {
    return veto('omega_vetado', `omega_vetado: ${result.verdict.razon.slice(0, 80)}`, { verdict: result.verdict }) // prettier-ignore
  }
  await closeOmega(ctx, cursor, proposal, 'OMEGA', 'omega aprobo', `omega_aprobado: ${result.verdict.razon.slice(0, 80)}`, { verdict: result.verdict }, deps.now()) // prettier-ignore
  return { ok: true, verdict: result.verdict }
}
