import type { ModoDeVuelta } from '@domain/repair/modo-vuelta'
import { canTransition, type Proposal } from '@domain/repair/proposal'
import { veredictoDelAnalisis } from '@domain/repair/veredicto-del-analisis'
import { extinguirSiObsoleto } from './extinguir-con-juicio'
import { newId, nowIso } from '@domain/shared/id'
import type { AppContext } from '../context'
import { analyzeTarget } from './analyze-target'
import { elegirObjetivo } from './elegir-objetivo'
import { conAgentRun, recordMotorRun } from './record-motor-run'
import { recordAnalyzed, recordElegido } from './record-plan-events'

/**
 * C1 -> C2 desde la app: ELIGE un hallazgo (determinista), ancla el HEAD del
 * repo y lo manda a ENTENDER (grafo-primero, solo lectura). Persiste el
 * veredicto: REAL deja la propuesta en ANALIZADO (lista para C3); OBSOLETO la
 * CADUCA y excluye al hallazgo hasta el proximo escaneo; ILEGIBLE la RECHAZA
 * sin excluir nada, porque ahi no se llego a saber si el hallazgo existe. Un
 * OBSOLETO ademas EXTINGUE el hallazgo, pero solo si su evidencia se comprueba
 * contra el fichero; si no, lo deja mitigado. NO genera fix.
 *
 * `findingId` invierte el primer paso: con el, quien eligio fue el operador y el
 * motor atiende ESE hallazgo sin mirar la cola ni el cerco de integracion
 * automatica —si no cabe, su fix acabara pidiendo firma humana—. Sin el, todo
 * ocurre como siempre: elige el orden.
 *
 * `modo` viaja hasta la seleccion porque decide su ALCANCE: hasta donde llegue
 * la vuelta es lo que dice que hallazgos vale la pena elegir.
 */
export async function planRepair(
  context: AppContext,
  projectId: string,
  findingId?: string,
  modo: ModoDeVuelta = 'completo'
): Promise<Proposal | null> {
  const project = context.projects.findById(projectId)
  if (!project) return null
  const scanId = context.scans.listByProject(projectId, 1)[0]?.id ?? ''
  // El HEAD se ancla ANTES de elegir: saber donde esta el arbol es parte de
  // decidir que reparar, porque un fracaso previo sobre esta misma base excluye.
  const baseSha = context.headSha(project.path)
  if (baseSha === null) return null
  const selection = elegirObjetivo(context, projectId, baseSha, project.path, modo, findingId)
  if (!selection) return null

  const now = Date.now()
  const proposal: Proposal = { id: newId(), projectId, findingId: selection.target.id, baseSha, state: 'ELEGIDO', createdAt: now, updatedAt: now } // prettier-ignore
  context.repairProposals.insert(proposal)
  await recordElegido(context.eventLog, proposal, scanId)

  const crudo = await analyzeTarget(context.analystFor(project.path, project.id), selection)
  const result = conAgentRun(crudo, recordMotorRun(context, projectId, null, crudo.runMeta))
  // Lo que el analista noto de FORTRESS se guarda pase lo que pase con el
  // hallazgo: un limite del que se topo vale igual si el hallazgo era un fantasma.
  for (const nota of result.analysis.notes ?? []) {
    context.selfObservations.add({ ...nota, sourceProject: project.name })
  }
  const veredicto = veredictoDelAnalisis(result.analysis)
  if (!canTransition(proposal.state, veredicto.state)) return proposal
  const patch = { state: veredicto.state, analysisVerdict: veredicto.verdict, analysisReason: veredicto.reason, updatedAt: Date.now() } // prettier-ignore
  context.repairProposals.update(proposal.id, patch)
  // El juicio del agente es lo unico que cierra un hallazgo, y solo si trae
  // prueba comprobable: sin ella el hallazgo se mitiga, no muere.
  extinguirSiObsoleto(context, project, result.analysis, veredicto, nowIso())
  await recordAnalyzed(context.eventLog, proposal, result, veredicto)
  return { ...proposal, ...patch }
}
