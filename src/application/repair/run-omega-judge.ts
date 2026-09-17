import type { Analysis, AnalystRunMeta } from '@domain/repair/analysis'
import { exceededBudget } from '@domain/repair/budget'
import type { Proposal } from '@domain/repair/proposal'
import type { AppContext } from '../context'
import type { BookCursor } from './book-cursor'
import { juzgar } from './juicio-de-omega'
import { closeOmega, emitOmegaMismatch, emitOmegaRun } from './run-omega-emit'
import { vetoDeLaPropuesta } from './run-omega-veto'
import type { OmegaDeps, RunOmegaResult } from './run-omega'
import { conAgentRun, recordMotorRun } from './record-motor-run'
import { falloDeOmega } from './omega-autopsia'
import { asentarNotasDelProyecto } from '../system/asentar-notas'

/**
 * Los ASIENTOS del Motor alrededor del juicio, ya dentro de la cola. El juicio
 * en si vive en `juzgar` y no sabe que existe una propuesta (ADR-090, Fase A):
 * aqui queda lo que es del libro mayor —la corrida, los eventos, el desacuerdo,
 * el presupuesto y el cierre de la propuesta—, que es justo lo que el Terminal
 * NO comparte.
 *
 * El veredicto que se PERSISTE es el del motor, no el del agente. Si el agente
 * veto algo que las cuatro reglas duras no vetan, guardar su palabra dejaba la
 * propuesta en un estado que dice aprobada llevando dentro un VETADO: la firma
 * lo leia y rebotaba, y la integracion automatica tambien. Los ejes se
 * conservan enteros —son la evidencia que el humano mira— y lo unico que se
 * sustituye es la conclusion, que por D19 nunca fue suya.
 */
export async function judgeProposal(
  ctx: AppContext,
  proposal: Proposal,
  analysis: Analysis,
  cursor: BookCursor,
  spent: number,
  worktreePath: string,
  deps: OmegaDeps
): Promise<RunOmegaResult> {
  const veto = vetoDeLaPropuesta(ctx, cursor, proposal, deps.now())

  // La doctrina se lee del WORKTREE, que es el arbol que OMEGA esta juzgando:
  // asi el fix se mide contra las decisiones vigentes en su ancla y no contra
  // las de un repo vivo que pudo moverse mientras la propuesta esperaba.
  const corpus = ctx.corpus.of(worktreePath)
  const entrada = { arbol: worktreePath, baseSha: proposal.baseSha, analysis, corpus }
  const juicio = await juzgar(entrada, deps)
  // Igual que en generate: el id existe antes de que el asiento lo cite.
  const runId = recordMotorRun(ctx, proposal.projectId, 'sentinel-omega', juicio.crudo.runMeta, juicio.computed === null) // prettier-ignore
  const asienta = (meta: AnalystRunMeta): Promise<void> =>
    emitOmegaRun(ctx, cursor, proposal.id, meta, juicio.evidencia)

  // Sin veredicto no hay juicio que asentar, solo una corrida que fallo.
  if (juicio.computed === null) {
    const fallido = conAgentRun(juicio.crudo, runId)
    await asienta(fallido.runMeta)
    const fallo = falloDeOmega(fallido)
    return veto(fallo.reason, fallo.detalle, fallo.evidencia)
  }
  const result = conAgentRun(juicio.crudo, runId)
  await asienta(result.runMeta)
  asentarNotasDelProyecto(ctx, proposal.projectId, result.notas)
  if (juicio.computed !== juicio.declarado) {
    await emitOmegaMismatch(ctx, cursor, proposal.id, result.verdict.veredicto_global, juicio.computed, deps.now()) // prettier-ignore
  }
  if (exceededBudget(spent, result.runMeta.tokensUsed ?? 0)) {
    return veto('budget_exceeded', 'budget_exceeded', { spent, cost: result.runMeta.tokensUsed })
  }
  if (juicio.computed === 'VETADO') {
    return veto('omega_vetado', `omega_vetado: ${result.verdict.razon.slice(0, 80)}`, { verdict: result.verdict }) // prettier-ignore
  }
  const veredicto = { ...result.verdict, veredicto_global: juicio.computed }
  await closeOmega(ctx, cursor, proposal, 'OMEGA', 'omega aprobo', `omega_aprobado: ${result.verdict.razon.slice(0, 80)}`, { verdict: veredicto }, deps.now()) // prettier-ignore
  return { ok: true, verdict: veredicto }
}
