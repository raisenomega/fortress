import { aCandidato } from './a-candidato'
import type { FindingMemory } from '@domain/project/finding-memory'
import { verificable } from '@domain/project/verificable'
import { paraVerificar } from '@domain/repair/target-verificacion'
import type { Selection } from '@domain/repair/select-target'
import type { AppContext } from '../context'

/**
 * El limbo: lo que el operador dio por arreglado, nadie ha comprobado, y sigue
 * contando. El criterio vive en el dominio —`verificable`— y aqui solo se le da
 * el nombre con el que el motor lo llama: la cajita de la fila y el contador del
 * boton preguntan a la MISMA funcion, y antes cada uno miraba lo suyo.
 */
export const mitigado = (f: FindingMemory): boolean => verificable(f)

/**
 * La TERCERA manera de llegar a un objetivo, y es de otra especie que las dos de
 * `elegirObjetivo` (ADR-087).
 *
 * Aquellas buscan algo que REPARAR y por eso pasan por `vivo` —ACTIVE y
 * abierto—, que rechaza los mitigados con razon: el operador ya dijo que hay un
 * fix, y repararlo otra vez seria inventar trabajo. Esta busca algo que
 * COMPROBAR, y acepta exactamente lo contrario: solo MITIGATED —y solo mientras
 * el operador no lo haya descartado, porque entonces ya dijo que no contaba—.
 *
 * Funcion aparte y no una bandera en la otra. Reparar y verificar son actos
 * distintos, y meterlos en la misma con un `modo` haria que verificar pareciera
 * pedir un fix — la misma razon por la que `status` y `lifecycle` viven
 * separados, donde mezclarlos haria que descartar pareciera arreglar.
 *
 * Del descuento de la cola conserva UNO: el de la propuesta viva. No por
 * disciplina sino por dinero — analizar lo que ya se esta trabajando cuesta una
 * corrida entera de agente y el motor va a dictaminar sobre ello igual. Los
 * otros dos no pintan: el alcance decide que se puede INTEGRAR y aqui no se
 * integra nada, y un rechazo bloqueante habla de fixes que fracasaron, no de
 * lecturas.
 */
export function elegirParaVerificar(
  context: AppContext,
  projectId: string,
  findingId: string
): Selection | null {
  const conPropuesta = new Set(context.repairProposals.findLiveFindingIds(projectId))
  const fila = context.findings.listMemory(projectId).find((f) => f.id === findingId && mitigado(f))
  if (fila === undefined || conPropuesta.has(fila.id)) return null
  return paraVerificar(aCandidato(fila))
}
