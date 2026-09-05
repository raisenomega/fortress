import type { MergeDecision } from '@domain/omega/merge-decision'
import type { PolicyEvaluation } from '@domain/repair/auto-merge-policy'
import type { MergeApplyOutcome } from '@domain/repair/merge-applier'
import { recordMergeDecision } from '../omega/record-merge-decision'
import type { AppContext } from '../context'
import { advanceProposal } from './advance-proposal'
import { cursorFrom } from './book-cursor'
import type { AutoMergeCase } from './auto-merge-gather'
import { autoMergeCommitMessage } from './auto-merge-message'
import type { AutoMergeDeps, AutoMergeResult, ViaDeIntegracion } from './auto-merge-types'
import { conCarrilDeMerge, OCUPADO } from './carril-del-merge'
import { mergePath } from './reconcile-verdict'

/** La razon que queda en el Libro. La misma palabra que el asunto del commit:
 *  dos asientos del mismo hecho no pueden contar dos historias. */
const ASUNTO_LIBRO: Readonly<Record<ViaDeIntegracion, string>> = {
  automatica: 'integracion automatica',
  firmada: 'integracion firmada por el operador'
}

/** La salida de git, acotada: el asiento tiene que caber en una pantalla. */
function detalleDe(outcome: Exclude<MergeApplyOutcome, { ok: true }>): string {
  if (outcome.kind === 'target-branch-detached') return outcome.kind
  return `${outcome.kind} — ${outcome.gitOutput.slice(0, 400)}`
}

/**
 * Lo que queda cuando la politica ya dijo que si: comprobar que el camino de
 * estados existe, aplicar, y asentar lo que haya pasado.
 *
 * Un merge que falla CADUCA la propuesta, nunca se reintenta ni se rebasa
 * sola: la rama nacio anclada a un baseSha y si el destino se movio lo suyo es
 * volver a generar contra la base nueva, no reescribir historia por su cuenta.
 */
export async function applyAutoMerge(
  ctx: AppContext,
  deps: AutoMergeDeps,
  caso: AutoMergeCase,
  policy: PolicyEvaluation,
  base: MergeDecision,
  via: ViaDeIntegracion = 'automatica'
): Promise<AutoMergeResult> {
  // Aqui la politica ya dijo que si: nada de lo que salga es una denegacion suya.
  const path = mergePath(caso.proposal.state)
  if (path === null) return { applied: false, reason: 'illegal-transition', denial: null }

  const outcome = await conCarrilDeMerge(deps.carril, caso.project.id, via, () =>
    deps.mergeApplier.apply({
      projectPath: caso.project.path,
      sourceBranch: caso.state.branch,
      commitMessage: autoMergeCommitMessage(caso, via)
    })
  )
  // El turno ocupado NO es un merge fallido: no se llego a tocar el arbol, asi
  // que no hay nada que abortar y la propuesta NO se caduca. Queda aprobada
  // esperando la firma, que es lo que el operador estaba haciendo. Caducarla
  // seria matar un fix bueno por una colision de horario.
  if (outcome === OCUPADO) return { applied: false, reason: OCUPADO, denial: null }
  const cursor = cursorFrom(caso.events)

  if (outcome.ok) {
    await advanceProposal(ctx, caso.proposal, path, ASUNTO_LIBRO[via], cursor, deps.now())
    recordMergeDecision(ctx, { ...base, policy, via, commitSha: outcome.mergeCommitSha })
    return { applied: true, mergeCommitSha: outcome.mergeCommitSha, denial: null }
  }

  const detalle = detalleDe(outcome)
  await advanceProposal(ctx, caso.proposal, ['CADUCADO'], `merge fallido — ${detalle}`, cursor, deps.now()) // prettier-ignore
  recordMergeDecision(ctx, { ...base, policy, via, applyError: detalle })
  return { applied: false, reason: `merge-failed-${outcome.kind}`, denial: null }
}
