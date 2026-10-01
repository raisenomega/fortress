import { computeAllowedFiles } from '@domain/repair/allowed-files'
import { allowsFor } from '@domain/repair/scope-check'
import { toSlug } from '@domain/repair/slug'
import { MOTIVO_WORKTREE } from '@domain/repair/motivo-del-worktree'
import type { AppContext } from '../context'
import type { GenerateDeps, GenerateResult } from './generate-types'
import type { Admitted } from './generate-guards'
import { makeFail, type FailFn } from './generate-fail'
import { guardDelArreglo } from './guard-del-arreglo'
import { emitDecision } from './record-generate-events'

export interface Prepared {
  readonly worktreePath: string
  readonly branch: string
  readonly allowed: string[]
  /** Globs que el proyecto abrio para un fix anclado aqui. Vacio si no declaro. */
  readonly allows: readonly string[]
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
  await emitDecision(ctx.eventLog, a.cursor, a.proposal.id, MOTIVO_WORKTREE, { worktreePath, branch, baseSha: a.proposal.baseSha, ok: true }, deps.now()) // prettier-ignore

  const sandbox = deps.sandbox(worktreePath, a.proposal.id, a.project.path)
  if (!sandbox.ok) return { failed: await fail('worktree_contaminated', { error: sandbox.error }, false) } // prettier-ignore

  const primary = String(a.analysis.target.file ?? '').trim()
  // Sin ancla no hay correa: fallar honesto, jamas caer a la prosa (se limpia).
  if (primary === '') return { failed: await fail('scope_violation', { error: 'no_primary_file' }, false) } // prettier-ignore
  const allowed = computeAllowedFiles({ primaryFile: primary, hint: a.analysis.where })
  // Los grupos se leen del worktree —el arbol del ancla— y solo cuentan los
  // que ESTE hallazgo activa: declarar terreno no lo abre para cualquier fix.
  //
  // Se resuelven ANTES de decidir que no hay terreno. La correa universal exige
  // que el archivo tenga extension, asi que para un `Dockerfile`, un `_headers`
  // o un `.env` sale siempre vacia — y son justo los casos donde el grupo
  // declarado era la unica via. Cortar antes de mirarlo lo hacia inalcanzable
  // para una clase entera de archivos.
  const allows = allowsFor(primary, deps.scopeGroups(worktreePath))
  // Sin correa Y sin grupo no hay terreno que darle al generador. Se limpia: no
  // hay nada que autopsiar, porque nunca llego a correr.
  if (allowed.length === 0 && allows.length === 0) return { failed: await fail('scope_violation', { where: a.analysis.where }, false) } // prettier-ignore
  // ADR-102 §3: con la correa y el terreno ya calculados, y ANTES de pagar el
  // generador, el arreglo que el analisis declaro tiene que caber en ellos.
  const parado = await guardDelArreglo(ctx, a, deps, { worktreePath, allowed, allows }, fail)
  if (parado !== null) return { failed: parado }

  return { worktreePath, branch, allowed, allows, fail }
}
