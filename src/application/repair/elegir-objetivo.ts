import type { FindingMemory } from '@domain/project/finding-memory'
import { senasDeIdentidad } from '@domain/project/finding-identity'
import { dentroDelAlcance } from '@domain/repair/alcance'
import type { ModoDeVuelta } from '@domain/repair/modo-vuelta'
import { hasBlockingRejection } from '@domain/repair/bloqueo-por-rechazo'
import { selectTarget, type Candidate, type Selection } from '@domain/repair/select-target'
import { dirigirA } from '@domain/repair/target-dirigido'
import type { AppContext } from '../context'

const aCandidato = ({ id, severity, title, file, line, firstSeen, identity }: FindingMemory): Candidate => ({ id, severity, title, file, line, firstSeen, ...senasDeIdentidad(identity) }) // prettier-ignore

export const vivo = (f: FindingMemory): boolean => f.lifecycle === 'ACTIVE' && f.status === 'open'

/** Candidatos: ACTIVE y abiertos, menos tres descuentos. Los OBSOLETOS bajo el
 *  escaneo vigente (un fantasma no se re-analiza en la misma generacion). Los
 *  que ya tienen propuesta VIVA: la seleccion es determinista y sin eso el mismo
 *  hallazgo saldria elegido en cada ronda mientras su propuesta espera la firma
 *  (ADR-059). Los que fracasaron por una causa que repetir no arregla con el
 *  arbol quieto: sin ese tercero, el motor compra el mismo fix hasta el tope. Y
 *  los que quedan fuera del alcance de ESTA vuelta: si puede integrar sola, solo
 *  lo que el cerco admitiria; si para antes del merge, todo menos las defensas.
 *  Exportada para que el panel diga cuantos QUEDAN sin recalcularlo por su
 *  lado: dos cuentas de lo mismo divergen, y el numero que el operador ve
 *  dejaria de ser el que el motor usa. */
export function candidates(
  context: AppContext,
  projectId: string,
  headSha: string,
  projectPath: string,
  modo: ModoDeVuelta
): Candidate[] {
  const excluded = new Set(context.repairProposals.findObsoleteFindingIds(projectId, headSha))
  for (const id of context.repairProposals.findLiveFindingIds(projectId)) excluded.add(id)
  const previas = context.repairProposals.listByProject(projectId)
  const config = context.fortressConfig(projectPath)
  return context.findings
    .listMemory(projectId)
    .filter((f) => vivo(f) && !excluded.has(f.id))
    .filter((f) => !hasBlockingRejection(f.id, headSha, previas))
    .filter((f) => dentroDelAlcance(modo, f.severity, f.file, config))
    .map(aCandidato)
}

/**
 * Las dos maneras de llegar a un objetivo, y son distintas de raiz: ELEGIR de la
 * cola —el motor decide, con su orden— o ATENDER lo que el operador senalo.
 *
 * De los descuentos de la cola, el dirigido solo conserva el de la propuesta
 * VIVA, y no por disciplina sino por dinero: analizar de nuevo lo que ya se esta
 * trabajando cuesta una corrida entera de agente y no aporta nada. Los demas
 * existen para que el motor no compre lo mismo cada ronda; un humano que
 * pregunta dos veces esta preguntando dos veces, y esa es su decision.
 *
 * El alcance es el caso claro: la cola no elige lo que esta vuelta no puede
 * llevar a ningun sitio, pero dirigido SI se trabaja, porque pedirlo a mano es
 * justamente pedir un fix para firma humana. Ese escape no necesita bandera: el
 * camino dirigido no pasa por la cola, asi que tampoco por su filtro.
 */
export function elegirObjetivo(
  context: AppContext,
  projectId: string,
  headSha: string,
  projectPath: string,
  modo: ModoDeVuelta,
  findingId?: string
): Selection | null {
  if (findingId === undefined) {
    return selectTarget(candidates(context, projectId, headSha, projectPath, modo))
  }

  const conPropuesta = new Set(context.repairProposals.findLiveFindingIds(projectId))
  const senalado = context.findings.listMemory(projectId).find((f) => f.id === findingId && vivo(f))
  if (senalado === undefined || conPropuesta.has(senalado.id)) return null
  return dirigirA(aCandidato(senalado))
}
