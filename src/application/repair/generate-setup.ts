import { computeAllowedFiles } from '@domain/repair/allowed-files'
import { toSlug } from '@domain/repair/slug'
import type { AppContext } from '../context'
import type { GenerateDeps, GenerateResult } from './generate-types'
import type { Admitted } from './generate-guards'
import { makeFail, type FailFn } from './generate-fail'
import { emitDecision } from './record-generate-events'

export interface Prepared {
  readonly worktreePath: string
  readonly branch: string
  readonly allowed: string[]
  readonly fail: FailFn
}

/**
 * Pre-generador: worktree sobre el ancla (D6/D7/D8), sandbox del plan y la
 * correa D10 anclada al file ESTRUCTURADO (I2.1) — la prosa del where es solo
 * hint. Devuelve el terreno preparado o el rechazo ya persistido.
 */
export async function prepareWorktree(
  ctx: AppContext,
  a: Admitted,
  deps: GenerateDeps
): Promise<{ failed: GenerateResult } | Prepared> {
  const worktreePath = `${deps.worktreeRoot}/${a.proposal.id}`
  const branch = `repair/${a.proposal.id.slice(0, 8)}-${toSlug(a.analysis.target.title)}`
  const fail = makeFail(ctx, deps, a, worktreePath, branch)

  const created = await deps.worktrees.create(a.proposal.baseSha, a.project.path, worktreePath, branch) // prettier-ignore
  // keep=true: git rechazo crearlo — no hay worktree que limpiar.
  if (!created.ok) return { failed: await fail('worktree_contaminated', { error: created.error }, true) } // prettier-ignore
  await emitDecision(ctx.eventLog, a.cursor, a.proposal.id, 'WORKTREE_CREATE', { worktreePath, branch, baseSha: a.proposal.baseSha, ok: true }, deps.now()) // prettier-ignore

  const sandbox = deps.sandbox(worktreePath, a.proposal.id, a.project.path)
  if (!sandbox.ok) return { failed: await fail('worktree_contaminated', { error: sandbox.error }, false) } // prettier-ignore

  const primary = String(a.analysis.target.file ?? '').trim()
  // Sin ancla no hay correa: fallar honesto, jamas caer a la prosa (se limpia).
  if (primary === '') return { failed: await fail('scope_violation', { error: 'no_primary_file' }, false) } // prettier-ignore
  const allowed = computeAllowedFiles({ primaryFile: primary, hint: a.analysis.where })
  // Se limpia: no hay nada que autopsiar, el generador nunca corrio.
  if (allowed.length === 0) return { failed: await fail('scope_violation', { where: a.analysis.where }, false) } // prettier-ignore

  return { worktreePath, branch, allowed, fail }
}
