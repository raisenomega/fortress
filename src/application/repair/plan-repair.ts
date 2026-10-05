import type { ModoDeVuelta } from '@domain/repair/modo-vuelta'
import { canTransition, type Proposal } from '@domain/repair/proposal'
import { veredictoDelAnalisis } from '@domain/repair/veredicto-del-analisis'
import { extinguirSiObsoleto } from './extinguir-con-juicio'
import { fundirPorJuicio } from './fundir-por-juicio'
import { newId, nowIso } from '@domain/shared/id'
import type { AppContext } from '../context'
import { estudiar } from './estudiar-con-memoria'
import { elegirObjetivo } from './elegir-objetivo'
import { NO_ES_SU_VEHICULO, esVehiculoDelMotor } from '@domain/repair/vehiculo-del-motor'
import { negado, planificada, type PlanResult } from './resultado-del-plan'
import { asentarNotasDelAnalista } from './asentar-notas-del-analista'
import { conAgentRun, recordMotorRun } from './record-motor-run'
import { recordAnalyzed, recordElegido } from './record-plan-events'
import { fallaDelProveedor } from '@domain/repair/falla-del-proveedor'

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
): Promise<PlanResult> {
  const project = context.projects.findById(projectId)
  if (!project) return negado('proyecto-desconocido')
  if (!esVehiculoDelMotor(context.esRepoPropio(project.path))) return negado(NO_ES_SU_VEHICULO)
  const scanId = context.scans.listByProject(projectId, 1)[0]?.id ?? ''
  // El HEAD se ancla ANTES de elegir: saber donde esta el arbol es parte de
  // decidir que reparar, porque un fracaso previo sobre esta misma base excluye.
  const baseSha = context.headSha(project.path)
  if (baseSha === null) return negado('sin-head-de-git')
  const selection = elegirObjetivo(context, projectId, baseSha, project.path, modo, findingId)
  if (!selection) return negado('sin-candidato')

  const now = Date.now()
  const proposal: Proposal = { id: newId(), projectId, findingId: selection.target.id, baseSha, state: 'ELEGIDO', createdAt: now, updatedAt: now } // prettier-ignore
  context.repairProposals.insert(proposal)
  await recordElegido(context.eventLog, proposal, scanId)

  const crudo = await estudiar(context, project, selection)
  // Si el proveedor tumbo al analista, la fila dice FALLO (Principio 24), no «ok $0».
  const result = conAgentRun(crudo, recordMotorRun(context, projectId, null, crudo.runMeta, fallaDelProveedor(crudo.analysis))) // prettier-ignore
  asentarNotasDelAnalista(context, project, result.analysis)
  const veredicto = veredictoDelAnalisis(result.analysis)
  if (!canTransition(proposal.state, veredicto.state)) return planificada(proposal)
  const patch = { state: veredicto.state, analysisVerdict: veredicto.verdict, analysisReason: veredicto.reason, updatedAt: Date.now() } // prettier-ignore
  context.repairProposals.update(proposal.id, patch)
  // El juicio del agente es lo unico que cierra un hallazgo, y solo si trae
  // prueba comprobable: sin ella el hallazgo se mitiga, no muere.
  extinguirSiObsoleto(context, project, result.analysis, veredicto, nowIso())
  // El juicio «mismo defecto» se persiste como fusion mas alias (ADR-101, corte 2).
  const fundido = fundirPorJuicio(context, project, { ...proposal, ...patch }, result.analysis)
  await recordAnalyzed(context.eventLog, proposal, result, veredicto)
  return planificada({ ...proposal, ...patch, ...(fundido ?? {}) })
}
