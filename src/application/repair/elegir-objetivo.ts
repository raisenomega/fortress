import type { FindingMemory } from '@domain/project/finding-memory'
import { hasBlockingRejection } from '@domain/repair/retry-eligibility'
import { selectTarget, type Candidate, type Selection } from '@domain/repair/select-target'
import { dirigirA } from '@domain/repair/target-dirigido'
import type { AppContext } from '../context'

const aCandidato = ({ id, severity, title, file, line, firstSeen }: FindingMemory): Candidate => ({ id, severity, title, file, line, firstSeen }) // prettier-ignore

const vivo = (f: FindingMemory): boolean => f.lifecycle === 'ACTIVE' && f.status === 'open'

/** Candidatos: ACTIVE y abiertos, menos tres descuentos. Los OBSOLETOS bajo el
 *  escaneo vigente (un fantasma no se re-analiza en la misma generacion). Los
 *  que ya tienen propuesta VIVA: la seleccion es determinista y sin eso el mismo
 *  hallazgo saldria elegido en cada ronda mientras su propuesta espera la firma
 *  (ADR-059). Y los que fracasaron por una causa que repetir no arregla con el
 *  arbol quieto: sin ese tercero, el motor compra el mismo fix hasta el tope. */
function candidates(context: AppContext, projectId: string, headSha: string): Candidate[] {
  const excluded = new Set(context.repairProposals.findObsoleteFindingIds(projectId, headSha))
  for (const id of context.repairProposals.findLiveFindingIds(projectId)) excluded.add(id)
  const previas = context.repairProposals.listByProject(projectId)
  return context.findings
    .listMemory(projectId)
    .filter((f) => vivo(f) && !excluded.has(f.id))
    .filter((f) => !hasBlockingRejection(f.id, headSha, previas))
    .map(aCandidato)
}

/**
 * Las dos maneras de llegar a un objetivo, y son distintas de raiz: ELEGIR de la
 * cola —el motor decide, con su orden— o ATENDER lo que el operador senalo.
 *
 * De los tres descuentos de la cola, el dirigido solo conserva el de la
 * propuesta VIVA, y no por disciplina sino por dinero: analizar de nuevo lo que
 * ya se esta trabajando cuesta una corrida entera de agente y no aporta nada.
 * Los otros dos —el fantasma del escaneo vigente, el fracaso que no se repite—
 * existen para que el motor no compre lo mismo cada ronda; un humano que
 * pregunta dos veces esta preguntando dos veces, y esa es su decision.
 */
export function elegirObjetivo(
  context: AppContext,
  projectId: string,
  headSha: string,
  findingId?: string
): Selection | null {
  if (findingId === undefined) return selectTarget(candidates(context, projectId, headSha))

  const conPropuesta = new Set(context.repairProposals.findLiveFindingIds(projectId))
  const senalado = context.findings.listMemory(projectId).find((f) => f.id === findingId && vivo(f))
  if (senalado === undefined || conPropuesta.has(senalado.id)) return null
  return dirigirA(aCandidato(senalado))
}
