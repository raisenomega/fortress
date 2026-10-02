import type { AppContext } from '../context'
import { autoMergeProposal } from './auto-merge-proposal'
import type { AutoMergeResult } from './auto-merge-types'
import { integrableSinFirma } from './integrable-sin-firma'
import type { JudgeDeps } from './judge-and-integrate'

/**
 * La integracion, cuando procede. Sale de `judgeAndIntegrate` porque el lazo
 * (ADR-110) necesita juzgar SIN integrar varias veces y integrar UNA, al final:
 * dejarla pegada al juicio obligaba a volver a pagar el revisor para integrar.
 *
 * Sobre el repo propio JUZGA pero no integra, y ahi la firma del operador es la
 * UNICA via, la pida quien la pida.
 *
 * Integrar no puede tumbar el veredicto: OMEGA ya juzgo y ya lo asento. Si la
 * integracion falla, se anota y el juicio sale igual — el operador tiene derecho
 * a saber que su propuesta paso, aunque el merge no. Devuelve `null` cuando la
 * integracion ni se planteo.
 */
export async function integrarSiProcede(
  ctx: AppContext,
  proposalId: string,
  deps: JudgeDeps
): Promise<AutoMergeResult | null> {
  // La comprobacion va DENTRO del try por lo mismo que el merge: si preguntar
  // de quien es el codigo revienta, el veredicto tiene que salir igual —y no se
  // integra, que es como la duda debe caer.
  try {
    if (!integrableSinFirma(ctx, proposalId, deps.esRepoPropio)) return null
    return await autoMergeProposal(ctx, deps.autoMerge, { proposalId })
  } catch (error) {
    console.error('[motor] fallo la integracion automatica', proposalId, error)
    return null
  }
}
