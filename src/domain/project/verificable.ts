import type { FindingLifecycle } from './finding-lifecycle'
import type { FindingStatus } from './finding-status'

/**
 * Lo minimo para decidir: los DOS ejes, nunca uno solo. Estructural y no atado a
 * `Finding` ni a `FindingMemory` — los dos tipos lo cumplen, y asi el criterio es
 * literalmente el mismo para el tablero y para el expediente del motor.
 */
interface ConLosDosEjes {
  readonly lifecycle: FindingLifecycle
  readonly status: FindingStatus
}

/**
 * A quien se le puede pedir una comprobacion, y el criterio es UNO para todos
 * los que preguntan: la cajita de la fila, el bucle que barre y el contador del
 * boton. Tenerlo escrito tres veces fue tenerlo escrito de dos maneras.
 *
 * Hacen falta LOS DOS EJES. `MITIGATED` dice que hay un fix esperando confirmar;
 * `open` dice que el hallazgo todavia cuenta. Mirando solo el ciclo de vida, un
 * mitigado que ADEMAS se descarto entraba en el barrido: el operador dijo que no
 * contaba y el motor le gastaba una corrida de agente igual.
 *
 * Es lo mismo que `estadoDelTablero` ya decidia al mandar ese caso a
 * «descartados» —«su dueño ya dijo que no contaba»— y que el resto del codigo
 * contradecia. La doctrina vive aqui, en una funcion, y no en tres docblocks.
 */
export function verificable(finding: ConLosDosEjes): boolean {
  return finding.lifecycle === 'MITIGATED' && finding.status === 'open'
}
