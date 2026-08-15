import type { AppContext } from '../context'
import { autoMergeProposal } from './auto-merge-proposal'
import type { AutoMergeDeps, AutoMergeResult } from './auto-merge-types'
import { runOmega, type OmegaDeps, type RunOmegaResult } from './run-omega'

export interface JudgeDeps {
  readonly omega: OmegaDeps
  readonly autoMerge: AutoMergeDeps
}

/**
 * Las dos cosas que hace, cada una por su nombre. Devolver solo el juicio era
 * un informe parcial: quien llame necesita saber tambien si la integracion se
 * planteo y con que resultado. `merge` es null cuando ni se planteo.
 *
 * El puente IPC sigue viajando `omega` a secas: el handler adapta. Enriquecer
 * el retorno hacia dentro no tiene por que mover el contrato de fuera.
 */
export interface JudgeResult {
  readonly omega: RunOmegaResult
  readonly merge: AutoMergeResult | null
}

/**
 * El juicio semantico y, si sale limpio, la integracion.
 *
 * Vivia dentro del handler IPC: la regla de CUANDO el motor integra estaba
 * escrita en la capa de transporte, junto al canal por el que viaja el clic.
 * Aqui esta con el resto de la doctrina del motor, y quien la necesite —el
 * loop, manana— la llama sin pasar por el puente.
 *
 * El veto corta antes de mirar la politica. Preguntarle a la politica si puede
 * integrar un fix que el revisor acaba de rechazar seria dar por bueno lo que
 * no lo es, y ensuciaria el libro con una decision que nadie tenia que tomar.
 *
 * Integrar no puede tumbar el veredicto: OMEGA ya juzgo y ya lo asento. Si la
 * integracion falla, se anota y el juicio sale igual — el operador tiene
 * derecho a saber que su propuesta paso, aunque el merge no.
 */
export async function judgeAndIntegrate(
  ctx: AppContext,
  proposalId: string,
  deps: JudgeDeps
): Promise<JudgeResult> {
  const omega = await runOmega(ctx, proposalId, deps.omega)
  if (!omega.ok || omega.verdict.veredicto_global !== 'APROBADO') return { omega, merge: null }

  try {
    return { omega, merge: await autoMergeProposal(ctx, deps.autoMerge, { proposalId }) }
  } catch (error) {
    console.error('[motor] fallo la integracion automatica', proposalId, error)
    return { omega, merge: null }
  }
}
