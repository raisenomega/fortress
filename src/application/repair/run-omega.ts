import type { AnalystRunMeta } from '@domain/repair/analysis'
import { computeSpent, MAX_TOKENS_PER_PROPOSAL, MIN_OMEGA_BUDGET } from '@domain/repair/budget'
import type { OmegaVerdict } from '@domain/repair/omega-verdict'
import type { AppContext } from '../context'
import { cursorFrom } from './book-cursor'
import { loadAnalysis } from './load-analysis'
import { closeOmega } from './run-omega-emit'
import type { OmegaReads } from './run-omega-inputs'
import { judgeProposal } from './run-omega-judge'

export type OmegaAgentResult =
  | { ok: true; verdict: OmegaVerdict; runMeta: AnalystRunMeta }
  /** `error` clasifica (razon cerrada); `detail` y `raw` son la autopsia. */
  | {
      ok: false
      error: string
      timedOut: boolean
      noArranco?: true
      runMeta: AnalystRunMeta
      detail?: string
      raw?: string
    }

export interface OmegaDeps extends OmegaReads {
  readonly worktreeRoot: string
  readonly worktreeExists: (path: string) => boolean
  readonly isClean: (path: string) => Promise<boolean>
  readonly omega: { run(worktreePath: string, prompt: string): Promise<OmegaAgentResult> }
  /** Cola de juicio compartida con el gate: UNO a la vez a nivel de proceso. */
  readonly enqueue: <T>(job: () => Promise<T>) => Promise<T>
  readonly now: () => number
}

export type RunOmegaResult = { ok: true; verdict: OmegaVerdict } | { ok: false; reason: string }

/**
 * I4 — el juicio SEMANTICO independiente. APROBADO -> OMEGA (espera firma
 * humana, I5). VETADO o fallo -> RECHAZADO. El worktree se conserva SIEMPRE.
 */
export async function runOmega(
  ctx: AppContext,
  proposalId: string,
  deps: OmegaDeps
): Promise<RunOmegaResult> {
  const proposal = ctx.repairProposals.findById(proposalId)
  if (!proposal || proposal.state !== 'GATE') return { ok: false, reason: 'invalid_state' }
  const events = await ctx.eventLog.list(proposalId)
  const cursor = cursorFrom(events)
  const analysis = loadAnalysis(events)
  if (analysis === null) return { ok: false, reason: 'invalid_state' }
  const worktreePath = `${deps.worktreeRoot}/${proposal.id}`
  const veto = async (reason: string): Promise<RunOmegaResult> => {
    await closeOmega(ctx, cursor, proposal, 'RECHAZADO', reason, reason, {}, deps.now())
    return { ok: false, reason }
  }

  if (!deps.worktreeExists(worktreePath)) return veto('worktree_missing')
  if (!(await deps.isClean(worktreePath))) return veto('worktree_contaminated')
  const spent = computeSpent(events)
  if (spent + MIN_OMEGA_BUDGET > MAX_TOKENS_PER_PROPOSAL) return veto('budget_exceeded')

  return deps.enqueue(() => judgeProposal(ctx, proposal, analysis, cursor, spent, worktreePath, deps)) // prettier-ignore
}
