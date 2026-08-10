import type { RejectionReason } from '@domain/repair/repair-rejection'
import type { AppContext } from '../context'
import type { GenerateDeps, GenerateResult } from './generate-types'
import { rejectWith, type Admitted } from './generate-guards'

export type FailFn = (
  reason: RejectionReason,
  evidence: object,
  keep: boolean
) => Promise<GenerateResult>

/**
 * Fabrica el rechazo de una generacion en curso: limpia el worktree salvo que
 * se conserve para autopsia (keep), asienta patch + eslabon, y devuelve el
 * resultado. Un solo camino de salida para todos los fallos del flujo.
 */
export function makeFail(
  ctx: AppContext,
  deps: GenerateDeps,
  admitted: Admitted,
  worktreePath: string,
  branch: string
): FailFn {
  return async (reason, evidence, keep) => {
    if (!keep) await deps.worktrees.remove(worktreePath, branch, admitted.project.path)
    await rejectWith(ctx, admitted.cursor, admitted.proposal, reason, evidence, deps.now())
    return { ok: false, reason, detail: JSON.stringify(evidence) }
  }
}
