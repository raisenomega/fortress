import type { AppContext } from '@application/context'
import type { ModoDeVuelta } from '@domain/repair/modo-vuelta'
import type { ChainOutcome } from '@application/repair/motor-chain-outcome'
import { runMotorChain, type MotorChainDeps } from '@application/repair/run-motor-chain'
import { err, type Result } from '@domain/shared/result'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'

/**
 * La vuelta del motor DENTRO del bucle autonomo, con el mismo freno que su
 * escaneo. Existe porque no lo tenia.
 *
 * El guard vive en los BORDES —los canales IPC lo toman, y `loopScan` tambien—
 * y nunca dentro de la aplicacion, que no sabe de carriles. El bucle es un
 * borde mas, pero llamaba a `runMotorChain` directamente y por ahi se colaba:
 * `scan` pasaba por el tope diario, el carril y el freno de contaminacion, y
 * `fix` —que gasta MAS, porque lanza analista, generador, gate y OMEGA— no
 * pasaba por ninguno. Un bucle desatendido podia vaciar el presupuesto del dia
 * entre dos escaneos que si se habrian frenado.
 *
 * El guard ENTERO y no solo el tope, por la misma razon que `loopScan`: los
 * tres frenos aplican. El de contaminacion sobre todo — un proyecto bloqueado
 * "hasta revision humana" es lo ultimo a lo que soltarle el motor solo.
 *
 * `endRun` en `finally`, como en `loopScan`: `guardRun` RESERVA al conceder, y
 * un carril que no se devuelve deja el proyecto ocupado para siempre.
 */
export async function loopFix(
  context: AppContext,
  projectId: string,
  deps: MotorChainDeps,
  modo: ModoDeVuelta
): Promise<Result<ChainOutcome>> {
  const busy = guardRun(context, projectId)
  if (busy !== null) return err(busy)

  try {
    return await runMotorChain(context, projectId, deps, modo)
  } finally {
    endRun(projectId)
  }
}
