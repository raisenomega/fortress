import { isActionable } from '@domain/repair/analysis'
import {
  canTransition,
  type AnalysisVerdict,
  type Proposal,
  type ProposalState
} from '@domain/repair/proposal'
import { newId } from '@domain/shared/id'
import type { AppContext } from '../context'
import { analyzeTarget } from './analyze-target'
import { elegirObjetivo } from './elegir-objetivo'
import { conAgentRun, recordMotorRun } from './record-motor-run'
import { recordAnalyzed, recordElegido } from './record-plan-events'

/**
 * C1 -> C2 desde la app: ELIGE un hallazgo (determinista), ancla el HEAD del
 * repo y lo manda a ENTENDER (grafo-primero, solo lectura). Persiste el
 * veredicto: REAL deja la propuesta en ANALIZADO (lista para C3); OBSOLETO la
 * CADUCA y excluye al hallazgo hasta el proximo escaneo. La extincion del
 * hallazgo NO se toca: eso es del escaneo, con evidencia. NO genera fix.
 *
 * `findingId` invierte el primer paso: con el, quien eligio fue el operador y el
 * motor atiende ESE hallazgo sin mirar la cola ni el cerco de integracion
 * automatica —si no cabe, su fix acabara pidiendo firma humana—. Sin el, todo
 * ocurre como siempre: elige el orden.
 */
export async function planRepair(
  context: AppContext,
  projectId: string,
  findingId?: string
): Promise<Proposal | null> {
  const project = context.projects.findById(projectId)
  if (!project) return null
  const scanId = context.scans.listByProject(projectId, 1)[0]?.id ?? ''
  // El HEAD se ancla ANTES de elegir: saber donde esta el arbol es parte de
  // decidir que reparar, porque un fracaso previo sobre esta misma base excluye.
  const baseSha = context.headSha(project.path)
  if (baseSha === null) return null
  const selection = elegirObjetivo(context, projectId, baseSha, findingId)
  if (!selection) return null

  const now = Date.now()
  const proposal: Proposal = { id: newId(), projectId, findingId: selection.target.id, baseSha, state: 'ELEGIDO', createdAt: now, updatedAt: now } // prettier-ignore
  context.repairProposals.insert(proposal)
  await recordElegido(context.eventLog, proposal, scanId)

  const crudo = await analyzeTarget(context.analystFor(project.path), selection)
  const result = conAgentRun(crudo, recordMotorRun(context, projectId, null, crudo.runMeta))
  // Lo que el analista noto de FORTRESS se guarda pase lo que pase con el
  // hallazgo: un limite del que se topo vale igual si el hallazgo era un fantasma.
  for (const nota of result.analysis.notes ?? []) {
    context.selfObservations.add({ ...nota, sourceProject: project.name })
  }
  const verdict: AnalysisVerdict = isActionable(result.analysis) ? 'REAL' : 'OBSOLETO'
  const state: ProposalState = verdict === 'REAL' ? 'ANALIZADO' : 'CADUCADO'
  if (!canTransition(proposal.state, state)) return proposal
  const patch = { state, analysisVerdict: verdict, analysisReason: result.analysis.risk, updatedAt: Date.now() } // prettier-ignore
  context.repairProposals.update(proposal.id, patch)
  await recordAnalyzed(context.eventLog, proposal, result, state)
  return { ...proposal, ...patch }
}
