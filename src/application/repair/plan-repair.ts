import { isActionable } from '@domain/repair/analysis'
import {
  canTransition,
  type AnalysisVerdict,
  type Proposal,
  type ProposalState
} from '@domain/repair/proposal'
import { hasBlockingRejection } from '@domain/repair/retry-eligibility'
import { selectTarget, type Candidate } from '@domain/repair/select-target'
import { newId } from '@domain/shared/id'
import type { AppContext } from '../context'
import { analyzeTarget } from './analyze-target'
import { conAgentRun, recordMotorRun } from './record-motor-run'
import { recordAnalyzed, recordElegido } from './record-plan-events'

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
    .filter((f) => f.lifecycle === 'ACTIVE' && f.status === 'open' && !excluded.has(f.id))
    .filter((f) => !hasBlockingRejection(f.id, headSha, previas))
    .map(({ id, severity, title, file, line, firstSeen }) => ({ id, severity, title, file, line, firstSeen })) // prettier-ignore
}

/**
 * C1 -> C2 desde la app: ELIGE un hallazgo (determinista), ancla el HEAD del
 * repo y lo manda a ENTENDER (grafo-primero, solo lectura). Persiste el
 * veredicto: REAL deja la propuesta en ANALIZADO (lista para C3); OBSOLETO la
 * CADUCA y excluye al hallazgo hasta el proximo escaneo. La extincion del
 * hallazgo NO se toca: eso es del escaneo, con evidencia. NO genera fix.
 */
export async function planRepair(context: AppContext, projectId: string): Promise<Proposal | null> {
  const project = context.projects.findById(projectId)
  if (!project) return null
  const scanId = context.scans.listByProject(projectId, 1)[0]?.id ?? ''
  // El HEAD se ancla ANTES de elegir: saber donde esta el arbol es parte de
  // decidir que reparar, porque un fracaso previo sobre esta misma base excluye.
  const baseSha = context.headSha(project.path)
  if (baseSha === null) return null
  const selection = selectTarget(candidates(context, projectId, baseSha))
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
