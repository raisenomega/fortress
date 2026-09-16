import { exceededBudget } from '@domain/repair/budget'
import { canTransition } from '@domain/repair/proposal'
import { checkScope } from '@domain/repair/scope-check'
import { soloTocaPruebas } from '@domain/repair/solo-toca-pruebas'
import { mensajeDelFix } from '@domain/repair/mensaje-del-fix'
import type { AppContext } from '../context'
import type { GenerateDeps, GenerateResult, Produced } from './generate-types'
import type { Admitted } from './generate-guards'
import type { FailFn } from './generate-fail'
import { emitOutcome } from './record-generate-events'

/**
 * Post-generacion: diff real, correa de scope, presupuesto final y commit.
 *
 * Vive aparte de `generateFix` porque son dos trabajos: uno lanza al agente y
 * el otro juzga lo que dejo. Juntos ya no cabian en un archivo.
 */
export async function verifyAndCommit(
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
  // Y antes de gastar el gate y el revisor: un fix que solo toca pruebas pasaria
  // VERDE sin rozar el defecto. Se corta aqui, donde ya esta el diff de git.
  // prettier-ignore
  if (soloTocaPruebas(changed, a.analysis.target.file)) return fail('solo_pruebas', { changed }, true)
  // CONSERVADO: el commit del fix existiria pero el coste excedio; autopsia posible.
  if (exceededBudget(a.spent, p.cost)) return fail('budget_exceeded', { spent: a.spent, cost: p.cost }, true) // prettier-ignore

  const message = mensajeDelFix(a.analysis.target, a.analysis.whatToChange)
  const commit = await deps.worktrees.commit(p.worktreePath, message)
  if (!commit.ok) return fail('no_diff_produced', { error: commit.error }, false)

  // Se devuelve SIN PERSISTIR, igual que `runGate` con su propia comprobacion.
  // Escribir aqui el RECHAZADO que hace `fail` seria responder a una transicion
  // ilegal ejecutando otra sin mirar si es legal: el remedio repitiendo la
  // enfermedad. Y no es un fallo del generador, que acaba de entregar su fix
  // —correa y presupuesto incluidos—: es la maquina de estados, que es nuestra.
  // prettier-ignore
  if (!canTransition(a.proposal.state, 'GENERADO')) return { ok: false, reason: 'invalid_state', detail: 'transicion invalida a GENERADO' }
  ctx.repairProposals.update(a.proposal.id, { state: 'GENERADO', analysisVerdict: 'REAL', analysisReason: a.proposal.analysisReason ?? '', updatedAt: deps.now() }) // prettier-ignore
  const diff = await deps.worktrees.diff(p.worktreePath, a.proposal.baseSha)
  await emitOutcome(ctx.eventLog, a.cursor, a.proposal.id, 'GENERADO', 'fix generado', { commitSha: commit.sha, ...diff }, deps.now()) // prettier-ignore
  return { ok: true, proposalId: a.proposal.id, commitSha: commit.sha, files: diff.files }
}
