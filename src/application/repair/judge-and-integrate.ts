import type { AppContext } from '../context'
import { integrarSiProcede } from './integrar-si-procede'
import type { AutoMergeDeps, AutoMergeResult } from './auto-merge-types'
import { runOmega, type OmegaDeps, type RunOmegaResult } from './run-omega'

export interface JudgeDeps {
  readonly omega: OmegaDeps
  readonly autoMerge: AutoMergeDeps
  /** Si la carpeta es el propio repo de FORTRESS. Puerto porque leerlo toca
   *  disco; la REGLA de que hacer con esa respuesta vive aqui, no en quien la
   *  responde, que es el mismo reparto que ya sigue el gate del loop. */
  readonly esRepoPropio: (projectPath: string) => boolean
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
 * Sobre el repo propio JUZGA pero no integra. El boton que pide el juicio lo
 * pide para eso, y hasta hoy arrastraba la integracion detras sin decirlo: la
 * garantia de `loop-gate` decia "por ninguna via" y esta era una via.
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
  deps: JudgeDeps,
  integrar = true
): Promise<JudgeResult> {
  const omega = await runOmega(ctx, proposalId, deps.omega)
  if (!omega.ok || omega.verdict.veredicto_global !== 'APROBADO') return { omega, merge: null }
  // Juzgar sin integrar: el fix queda aprobado esperando la firma humana. El
  // merge no se "salta", es que en ese modo no es de esta funcion. Sobre el
  // codigo propio es lo mismo, y por una razon mas fuerte: ahi la firma es la
  // UNICA via, la pida quien la pida.
  if (!integrar) return { omega, merge: null }
  return { omega, merge: await integrarSiProcede(ctx, proposalId, deps) }
}
