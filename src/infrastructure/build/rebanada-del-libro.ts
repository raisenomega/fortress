import type { AppContext } from '@application/context'
import type { MarcoDelKit } from '@domain/build/bloque-cto-kit'
import { marcoDeGrafo } from '@domain/build/marco-de-grafo'
import { marcoDeHallazgos, marcoDeHistoria, marcoDelLibroDeVida } from '@domain/build/marcos-del-libro' // prettier-ignore
import { marcoDeCognicion, marcoDeDocs, marcoDeReparaciones } from '@domain/build/marcos-del-motor'
import { readCognitionLog } from '../cognition/read-cognition-log'
import { leerOverviewDelGrafo } from '../graph/leer-overview-del-grafo'
import { listProjectDocs } from '../newproject/docs-reader'
import { resolveTarget } from './build-target'

/** Asientos de OMEGA y propuestas del motor que entran en la rebanada. */
const ASIENTOS = 10
const PROPUESTAS = 5

/**
 * La REBANADA del libro de vida para el turno de CTO (Sello B.1): TODAS las
 * lecturas parametrizadas por UN solo projectId —el del turno— resuelto con
 * `resolveTarget` (leer cliente si; editar y push, jamas por este camino).
 *
 * El ancla indirecta de los eventos queda CERRADA aqui: primero las propuestas
 * DEL PROYECTO (repair_proposals.project_id) y solo de esas se cuelgan sus
 * eventos. PROHIBIDOS los canales transversales: ni `omegaLog.list` sin
 * proyecto ni corridas por agente. Proyecto ausente = rebanada vacia, como un
 * kit sin sembrar: jamas la de otro.
 *
 * Sello B.2: el 7o marco es el GRAFO del MISMO target (overview, fail-safe,
 * leido de una copia fenced), en paralelo con los eventos. Mas contexto, no
 * mas autoridad: entra bajo la misma cabecera, anclado al mismo projectId.
 */
export async function rebanadaDelLibro(
  context: AppContext,
  projectId: string
): Promise<readonly MarcoDelKit[]> {
  const target = resolveTarget(context, projectId)
  if (!target.ok) return []
  const propuestas = context.repairProposals.listByProject(projectId).slice(0, PROPUESTAS)
  const [conEventos, overview] = await Promise.all([
    Promise.all(propuestas.map(async (p) => ({ propuesta: p, eventos: await context.eventLog.list(p.id) }))), // prettier-ignore
    leerOverviewDelGrafo(target.value)
  ])
  return [
    marcoDeHallazgos(context.findings.listByProject(projectId)),
    marcoDeHistoria(context.findings.listHistoria(projectId)),
    marcoDelLibroDeVida(context.omegaLog.listByProject(projectId, ASIENTOS)),
    marcoDeReparaciones(conEventos),
    marcoDeCognicion(readCognitionLog(target.value.path)),
    marcoDeDocs(listProjectDocs(target.value.path)),
    marcoDeGrafo(overview)
  ]
}
