import { loQueElMotorSupo } from '@domain/repair/lo-que-el-motor-supo'
import type { Analysis } from '@domain/repair/analysis'
import type { Proposal } from '@domain/repair/proposal'
import type { AppContext } from '../context'
import type { EntradaDelJuicio } from './juicio-de-omega'

/**
 * Lo que el MOTOR le pone delante a OMEGA, armado aqui y no en `juzgar` porque
 * `juzgar` no sabe que existe una propuesta (ADR-090, Fase A) y esto sale entero
 * del libro mayor.
 *
 * La doctrina se lee del WORKTREE, que es el arbol que OMEGA esta juzgando: asi
 * el fix se mide contra las decisiones vigentes en su ancla y no contra las de un
 * repo vivo que pudo moverse mientras la propuesta esperaba.
 *
 * Y lo que el motor ya sabia se LEE del libro de ESTA propuesta, nunca se
 * recalcula (DEUDAS §6.12): la correa que aplico y el resultado del gate. El
 * Terminal no pasa por aqui y no lleva el bloque, que es correcto — alli no hay
 * propuesta, ni correa, ni gate que ensenar.
 */
export async function entradaDelJuicio(
  ctx: AppContext,
  proposal: Proposal,
  analysis: Analysis,
  worktreePath: string
): Promise<EntradaDelJuicio> {
  return {
    arbol: worktreePath,
    baseSha: proposal.baseSha,
    analysis,
    corpus: ctx.corpus.of(worktreePath),
    motorSupo: loQueElMotorSupo(await ctx.eventLog.list(proposal.id))
  }
}
