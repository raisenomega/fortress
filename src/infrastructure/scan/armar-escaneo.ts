import { asentarAplicabilidad } from '@application/scan/asentar-aplicabilidad'
import { asentarIntentoFallido } from '@application/scan/asentar-intento-fallido'
import type { AppContext } from '@application/context'
import type { ScanDeps } from '@application/scan/run-scan'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import type { Scanner } from '@domain/scan/scanner'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { createClaudeScanner } from './claude-scanner'
import { crearJuez } from './juez-de-aplicabilidad'
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
 */
export function armarEscaneo(context: AppContext, projectId: string): EscaneoArmado {
  const agente = createClaudeCodeAgent(context.apiKeys, readBudget(context), usesApiKey(context))
  const juez = crearJuez(agente, (v) => asentarAplicabilidad(context, projectId, v))

  return {
    scanner: createClaudeScanner(agente, (intento) => asentarIntentoFallido(context, intento)),
    medir: (path, declaracion) => medirProyecto(path, declaracion, juez)
  }
}
