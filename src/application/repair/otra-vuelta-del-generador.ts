import { canAffordGenerator, computeSpent } from '@domain/repair/budget'
import { MOTIVO_HUELLA } from '@domain/repair/motivo-de-la-huella'
import type { AppContext } from '../context'
import { makeFail } from './generate-fail'
import type { Admitted } from './generate-guards'
import type { GenerateDeps, GenerateResult } from './generate-types'
import { loadAnalysis } from './load-analysis'
import { motivoDelGenerador } from './motivo-del-generador'
import { cursorFrom, emitDecision, emitGeneratorRun } from './record-generate-events'
import { conAgentRun, recordMotorRun } from './record-motor-run'
import { correaDe, rutaYRama } from './terreno-de-la-propuesta'
import { verifyAndCommit } from './verify-and-commit'

/** El expediente de la vuelta, reunido del libro. `null` cuando la propuesta no
 *  esta donde el lazo la deja (OMEGA) o le falta con que trabajar. */
async function expediente(ctx: AppContext, proposalId: string): Promise<Admitted | null> {
  const proposal = ctx.repairProposals.findById(proposalId)
  if (!proposal || proposal.state !== 'OMEGA') return null
  const project = ctx.projects.findById(proposal.projectId)
  if (!project) return null
  const events = await ctx.eventLog.list(proposalId)
  const analysis = loadAnalysis(events)
  if (analysis === null) return null
  return { proposal, project, analysis, cursor: cursorFrom(events), spent: computeSpent(events) }
}

/**
 * Una vuelta MAS del generador sobre la MISMA propuesta (ADR-110): reanuda su
 * sesion, le da la objecion de OMEGA y vuelve a dejar el fix en GENERADO.
 *
 * NO pasa por `admitProposal` y no es un descuido: aquella guarda exige
 * `ANALIZADO`, que es el estado de la PRIMERA vuelta. Lo que si se conserva es
 * su guarda de PRESUPUESTO —`canAffordGenerator` sobre lo ya gastado—, que es la
 * que importa aqui: una vuelta es otra corrida y se paga.
 *
 * El worktree NO se vuelve a crear: la vuelta trabaja sobre el arbol donde quedo
 * el fix anterior, que es justo lo que permite completarlo en vez de rehacerlo.
 * Y la correa se recalcula IGUAL, nunca a partir de la objecion: el lazo no
 * ensancha el terreno (ADR-110 §7).
 */
export async function otraVueltaDelGenerador(
  ctx: AppContext,
  proposalId: string,
  objecion: string,
  sesion: string,
  deps: GenerateDeps
): Promise<GenerateResult> {
  const a = await expediente(ctx, proposalId)
  if (a === null) return { ok: false, reason: 'invalid_state', detail: 'la vuelta no tiene donde' }

  const { worktreePath, branch } = rutaYRama(a, deps)
  const fail = makeFail(ctx, deps, a, worktreePath, branch)
  if (!canAffordGenerator(a.spent)) return fail('budget_exceeded', { spent: a.spent }, true)

  const caja = deps.sandbox(worktreePath, a.proposal.id, a.project.path)
  if (!caja.ok) return fail('worktree_contaminated', { error: caja.error }, false)
  const correa = correaDe(a, deps, worktreePath)
  if (correa === null) return fail('scope_violation', { error: 'no_primary_file' }, false)

  const crudo = await deps.generator.generate(worktreePath, objecion, sesion)
  const result = conAgentRun(crudo, recordMotorRun(ctx, a.proposal.projectId, null, crudo.runMeta, !crudo.ok)) // prettier-ignore
  await emitGeneratorRun(ctx.eventLog, a.cursor, a.proposal.id, result.runMeta)
  const huella = await deps.worktrees.huella(worktreePath)
  await emitDecision(ctx.eventLog, a.cursor, a.proposal.id, MOTIVO_HUELLA, { huella, turnos: result.runMeta.usage?.numTurns ?? null, gasto: result.runMeta.tokensUsed ?? null }, deps.now()) // prettier-ignore
  if (!result.ok) return { ...(await fail(motivoDelGenerador(result), { error: result.error }, true)), sesion: crudo.sesion } // prettier-ignore

  const hecho = await verifyAndCommit(ctx, a, deps, fail, { worktreePath, ...correa, cost: result.runMeta.tokensUsed ?? 0 }) // prettier-ignore
  return { ...hecho, sesion: crudo.sesion }
}
