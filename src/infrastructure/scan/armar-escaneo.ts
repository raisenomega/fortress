import { asentarAplicabilidad } from '@application/scan/asentar-aplicabilidad'
import { asentarIntentoFallido } from '@application/scan/asentar-intento-fallido'
import type { AppContext } from '@application/context'
import type { ScanDeps } from '@application/scan/run-scan'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import type { Scanner } from '@domain/scan/scanner'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { SIN_TECHO } from '../claude-code/run-claude-process'
import { createClaudeScanner } from './claude-scanner'
import { crearJuez } from './juez-de-aplicabilidad'
import { conKitSembrado } from './medir-deps'
import { medirProyecto } from './medir-proyecto'

export interface EscaneoArmado {
  readonly scanner: Scanner
  readonly medir: ScanDeps['medir']
}

/**
 * Las dos piezas que un escaneo necesita de fuera, armadas juntas porque
 * comparten el AGENTE: el escaner que audita y el juez que clasifica el alcance
 * salen del mismo proceso `claude` y del mismo presupuesto. Armarlos por
 * separado en cada handler duplicaba el montaje, y una copia acaba divergiendo.
 *
 * Los dos callbacks asientan lo que de otro modo se perderia: la factura de un
 * intento fallido, y el veredicto de aplicabilidad con su cita. Ninguno de los
 * dos puede tumbar el escaneo — los dos tragan su error.
 *
 * Y los dos corren SIN techo de tiempo, asi que los dos llevan el `projectId`:
 * es lo que hace que Detener los alcance, y sin reloj es la unica red.
 */
export function armarEscaneo(context: AppContext, projectId: string): EscaneoArmado {
  // SIN TECHO (ADR-082, Enmienda 3): el escaneo se toma el tiempo que necesite
  // y solo Detener lo para. Los otros cinco caminos que crean este agente no
  // pasan nada y conservan sus 15 minutos.
  const agente = createClaudeCodeAgent(context.apiKeys, readBudget(context), usesApiKey(context), null, {}, SIN_TECHO) // prettier-ignore
  const juez = crearJuez(agente, projectId, (v) => asentarAplicabilidad(context, projectId, v))

  return {
    scanner: createClaudeScanner(agente, (intento) => asentarIntentoFallido(context, intento)),
    medir: (path, declaracion) => medirProyecto(path, declaracion, conKitSembrado(juez))
  }
}
